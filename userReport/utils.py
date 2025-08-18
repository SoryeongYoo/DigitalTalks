# utils.py
# -*- coding: utf-8 -*-

import streamlit as st
from typing import Optional
from config import (
    MIN_TEMP, MAX_TEMP, TEMP_RANGE, POSITIVE_HINTS, NEUTRAL_SHORT_CHARS,
    DEFAULT_CAUTION_TEMP, DEFAULT_WARN_TEMP
)


def hex_to_rgba(hex_color: str, alpha: float = 0.2) -> str:
    """Hex 색상을 RGBA로 변환합니다."""
    h = (hex_color or "").lstrip('#')
    if len(h) == 3:
        h = ''.join(ch * 2 for ch in h)
    try:
        r = int(h[0:2], 16)
        g = int(h[2:4], 16)
        b = int(h[4:6], 16)
    except Exception:
        r, g, b = 0, 0, 0
    a = max(0.0, min(1.0, float(alpha)))
    return f"rgba({r},{g},{b},{a})"


def map_temp(tox_score: float) -> float:
    """독성 점수(0-1)를 온도(36.5-40.0°C)로 매핑합니다."""
    tox = max(0.0, min(1.0, float(tox_score)))
    return round(MIN_TEMP + tox * TEMP_RANGE, 2)


def post_temp_from_rate(rate: float) -> float:
    """
    게시글 단위 유해발언 비율(0-1)을 온도(36.5-40.0°C)로 매핑합니다.
    명세: 1%p 증가당 0.035°C → 100% = +3.5°C
    """
    r = max(0.0, min(1.0, float(rate)))
    return round(MIN_TEMP + r * 3.5, 2)


def severity_from_temp(temp: float) -> str:
    """온도에 따른 심각도를 반환합니다."""
    warn_threshold = st.session_state.get("warn_c", DEFAULT_WARN_TEMP)
    caution_threshold = st.session_state.get("caution_c", DEFAULT_CAUTION_TEMP)

    if temp >= warn_threshold:
        return "경고"
    if temp >= caution_threshold:
        return "주의"
    return "정상"


def looks_positive_or_short(text: str) -> bool:
    """텍스트가 긍정적이거나 짧은 중성 표현인지 확인합니다."""
    t = (text or "").strip()
    if len(t) <= 2 or all(ch in NEUTRAL_SHORT_CHARS for ch in t):
        return True
    return any(w in t for w in POSITIVE_HINTS)


def badge_from_comment(text: str, res: dict, temp_c: float) -> Optional[str]:
    """
    댓글에 대한 표시용 배지를 결정합니다.

    Returns:
        str or None: '경고' / '주의' / None
    """
    caution = st.session_state.get("caution_c", DEFAULT_CAUTION_TEMP)
    warn = st.session_state.get("warn_c", DEFAULT_WARN_TEMP)

    if temp_c >= warn:
        return "경고"

    if temp_c >= caution:
        if looks_positive_or_short(text):
            return None

        reasons = res.get("reasons", {}) if isinstance(res, dict) else {}
        max_reason = max(reasons.values()) if reasons else 0.0

        if (max_reason >= 0.5 or
                res.get("aggression", 0) >= 0.5 or
                res.get("hate", 0) >= 0.4):
            return "주의"

    return None