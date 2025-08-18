# analyzer.py
# -*- coding: utf-8 -*-

import os
import numpy as np
from typing import Dict, Optional

try:
    from openai import OpenAI

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    client = OpenAI() if OPENAI_API_KEY else None
except Exception:
    client = None


def analyze_text(text: str) -> Dict[str, any]:
    """
    텍스트를 분석하여 유해성 점수와 개선 제안을 반환합니다.

    Returns:
        dict: {toxicity, hate, aggression, demean, reasons, suggestion}
    """

    # OpenAI API가 없으면 시뮬레이션 사용
    if client is None or not os.getenv("OPENAI_API_KEY"):
        return _simulate_analysis(text)

    # 실제 OpenAI 분석
    try:
        return _analyze_with_openai(text)
    except Exception:
        return _simulate_analysis(text)


def _simulate_analysis(text: str) -> Dict[str, any]:
    """시뮬레이션을 통한 텍스트 분석"""
    seed = abs(hash(text)) % 2 ** 32
    rng = np.random.default_rng(seed)

    tox = float(rng.beta(2.2, 2.0))
    hate = float(min(1.0, tox * rng.uniform(0.3, 1.0) * rng.uniform(0.2, 0.9)))
    aggr = float(min(1.0, tox * rng.uniform(0.5, 1.0)))
    demean = float(min(1.0, tox * rng.uniform(0.2, 0.8)))

    base = np.array([hate, aggr, demean]) + 1e-9
    base = base / base.max()

    return {
        "toxicity": tox,
        "hate": hate,
        "aggression": aggr,
        "demean": float(demean),
        "reasons": {
            "혐오": float(base[0]),
            "조롱/모욕": float(base[1]),
            "비하": float(base[2])
        },
        "suggestion": "감정 대신 사실 중심으로 표현해볼래?",
    }


def _analyze_with_openai(text: str) -> Dict[str, any]:
    """OpenAI API를 사용한 실제 텍스트 분석"""
    # Moderation API 호출
    mod = client.moderations.create(model="omni-moderation-latest", input=text)
    r = mod.results[0]

    def score(key):
        if hasattr(r, "category_scores") and key in r.category_scores:
            return float(r.category_scores[key])
        if hasattr(r, "categories") and key in r.categories and isinstance(r.categories[key], (int, float)):
            return float(r.categories[key])
        return 0.0

    hate = max(score("hate"), score("hate/threatening"))
    haras = max(score("harassment"), score("harassment/threats"))
    viol = max(score("violence"), score("violence/threats"))
    tox = max(hate, haras, viol)
    demean = min(1.0, 0.6 * haras + 0.5 * hate)

    # 개선 제안 생성
    sys_prompt = (
        "너는 온라인 커뮤니케이션 코치다. 원문 의미는 유지하되 비하/조롱/혐오/욕설을 제거하고, "
        "친근하고 사실 중심의 한국어 1문장을 제안하라. 훈계는 금지."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"원문: {text}\n요구: 한국어 1문장으로 순화"}
        ]
    )

    suggestion = response.choices[0].message.content.strip()

    # 사유별 점수 정규화
    vec = np.array([hate, haras, demean])
    if vec.max() == 0:
        vec = np.array([0.2, 0.2, 0.2])
    reasons = vec / vec.max()

    return {
        "toxicity": float(tox),
        "hate": float(hate),
        "aggression": float(haras),
        "demean": float(demean),
        "reasons": {
            "혐오": float(reasons[0]),
            "조롱/모욕": float(reasons[1]),
            "비하": float(reasons[2])
        },
        "suggestion": suggestion,
    }