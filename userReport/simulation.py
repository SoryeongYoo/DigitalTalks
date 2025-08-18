# simulation.py
# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from config import KST
from utils import map_temp


def generate_simulation_comments() -> List[Dict[str, Any]]:
    """시뮬레이션용 댓글 데이터를 생성합니다."""
    sim_comments = [
        {"text": "뭐 이런 걸 올려? 진짜 수준 바닥이네 ㅅㅂ.", "level": "warn"},
        {"text": "관종짓 그만해라. 보는 사람 기분 더러워지니까.", "level": "caution"},
        {"text": "말꼬리 잡고 떠드는 꼴 역겹다. 자중해.", "level": "warn"},
        {"text": "이건 좀 선 넘었다. 말투부터 남 무시하는데?", "level": "caution"},
        {"text": ".", "level": "ok"},
        {"text": "완전 최고! 다음 것도 기대함.", "level": "ok"},
        {"text": "꺼져라 제발. 이런 쓰레기 콘텐츠는 노답.", "level": "warn"},
    ]

    items = []
    for i, c in enumerate(sim_comments, start=1):
        # 시뮬레이터용 강제 온도/유해 여부 (배지/블러 일관성 보장)
        if c.get("level") == "warn":
            sim_temp = 39.3
            sim_harm = True
        elif c.get("level") == "caution":
            sim_temp = 38.6
            sim_harm = True
        else:
            sim_temp = 36.8
            sim_harm = False

        items.append({
            "id": i,
            "author": f"user{i:02d}",
            "text": c["text"],
            "dt": datetime.now(KST),
            "sim_temp": sim_temp,
            "sim_harm": sim_harm,
        })

    return items


def generate_weekly_events(user_id: str, start_date, end_date) -> pd.DataFrame:
    """주간 리포트용 시뮬레이션 데이터를 생성합니다."""
    rng = np.random.default_rng(123)
    days = pd.date_range(start=start_date, end=end_date, freq='D')
    rows = []

    for d in days:
        for _ in range(rng.integers(8, 20)):
            tox = float(rng.beta(2.0, 2.2))
            temp = map_temp(tox)

            # 유해도가 높은 댓글(온도 38도 이상)에만 리라이팅 제안
            # 약 30% 정도의 댓글에만 제안이 생성됨
            has_suggestion = temp >= 38.0

            if has_suggestion:
                # 제안이 있을 때만 선택지 생성 (수락률 약 65%)
                choice = rng.choice(["원문", "순화"], p=[0.35, 0.65])
                suggestion = "리라이팅 제안됨"
            else:
                # 제안이 없으면 원문 그대로 전송
                choice = "원문"
                suggestion = None

            rows.append({
                "created_at": d + timedelta(minutes=int(rng.integers(0, 24 * 60))),
                "user_id": user_id,
                "toxicity": tox,
                "aggression": float(min(1, tox * rng.uniform(.5, 1))),
                "hate": float(min(1, tox * rng.uniform(.2, .9))),
                "temp_c": temp,
                "sent_choice": choice,
                "suggestion": suggestion
            })

    return pd.DataFrame(rows)