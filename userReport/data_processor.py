# data_processor.py
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from analyzer import analyze_text
from utils import map_temp, severity_from_temp, badge_from_comment
from config import KST, DEFAULT_CAUTION_TEMP, DEFAULT_WARN_TEMP
import streamlit as st


def process_comments(items: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, float], float, int]:
    """
    댓글 목록을 분석하여 결과를 반환합니다.

    Args:
        items: 댓글 목록 [{"id", "author", "text", "dt", ...}]

    Returns:
        tuple: (분석된_댓글들, 집계된_사유들, 게시글_온도, 유해_댓글_수)
    """
    caution = st.session_state.get("caution_c", DEFAULT_CAUTION_TEMP)
    warn = st.session_state.get("warn_c", DEFAULT_WARN_TEMP)

    results = []
    agg_reasons = {"혐오": 0.0, "조롱/모욕": 0.0, "비하": 0.0}
    harmful_cnt = 0

    for it in items:
        res = analyze_text(it["text"]) or {}

        # 시뮬레이션 데이터인 경우 강제 온도/유해 여부 사용
        if "sim_temp" in it:
            temp_c = float(it["sim_temp"])
            sev = severity_from_temp(temp_c)
            harmful = bool(it.get("sim_harm", False))
        else:
            temp_c = map_temp(res.get("toxicity", 0.0))
            sev = "경고" if temp_c >= warn else ("주의" if temp_c >= caution else "정상")
            harmful = temp_c >= caution

        # 유해 댓글인 경우 사유 집계
        if harmful:
            harmful_cnt += 1
            r = res.get("reasons", {})
            agg_reasons["혐오"] += float(r.get("혐오", 0.0))
            agg_reasons["조롱/모욕"] += float(r.get("조롱/모욕", 0.0))
            agg_reasons["비하"] += float(r.get("비하", 0.0))

        # 표시용 배지 결정 (오탐 억제 규칙 적용)
        if "sim_temp" in it:
            # 시뮬레이션: 온도 기준만 적용
            badge = ("경고" if temp_c >= warn else ("주의" if temp_c >= caution else None))
        else:
            badge = badge_from_comment(it["text"], res, temp_c)

        results.append({
            "id": it["id"],
            "author": it["author"],
            "text": it["text"],
            "dt": it["dt"],
            "temp_c": temp_c,
            "severity": sev,
            "harmful": harmful,
            "suggestion": res.get("suggestion"),
            "badge": badge
        })

    # 게시글 단위 온도 계산 - 중복 함수 제거하고 직접 계산
    total = len(items)
    harm_rate = harmful_cnt / total if total else 0.0
    # 게시글 단위 유해발언 비율(0-1)을 온도(36.5-40.0°C)로 매핑
    # 명세: 1%p 증가당 0.035°C → 100% = +3.5°C
    post_temp = round(36.5 + harm_rate * 3.5, 2)

    # 사유 정규화
    if harmful_cnt > 0:
        maxv = max(agg_reasons.values()) or 1e-9
        norm_reasons = {k: (v / maxv) for k, v in agg_reasons.items()}
    else:
        norm_reasons = {"혐오": 0.0, "조롱/모욕": 0.0, "비하": 0.0}

    return results, norm_reasons, post_temp, harmful_cnt


def post_temp_from_rate(rate: float) -> float:
    """게시글 단위 유해발언 비율을 온도로 변환합니다."""
    from utils import post_temp_from_rate as util_func
    return util_func(rate)


def process_weekly_data(df: pd.DataFrame) -> Tuple[Dict[str, int], pd.DataFrame]:
    """
    주간 데이터를 처리하여 KPI와 일별 집계를 반환합니다.

    Args:
        df: 이벤트 데이터프레임

    Returns:
        tuple: (KPI_딕셔너리, 일별_집계_데이터프레임)
    """
    if df.empty:
        return {}, pd.DataFrame()

    # 날짜 파생
    dt_series = pd.to_datetime(df["created_at"], utc=True, errors='coerce')
    dt_series = dt_series.fillna(pd.to_datetime(df["created_at"]))
    try:
        dt_kst = dt_series.dt.tz_convert(KST)
    except Exception:
        dt_kst = dt_series
    df["date"] = dt_kst.dt.date

    # KPI 계산
    total = len(df)
    suggested = int(df["suggestion"].notna().sum()) if "suggestion" in df.columns else total
    accepted = int((df.get("sent_choice", "순화") == "순화").sum())
    accept_rate = (accepted / max(suggested, 1)) * 100
    avg_temp = float(df["temp_c"].mean())

    kpi = {
        "total": total,
        "suggested": suggested,
        "accepted": accepted,
        "accept_rate": accept_rate,
        "avg_temp": avg_temp
    }

    # 일별 집계 (Pandas 경고 해결)
    grp = df.groupby("date")
    daily = pd.DataFrame({"date": sorted(df["date"].unique())})

    hate_rate = grp.apply(lambda g: (g["hate"] >= 0.5).mean() * 100, include_groups=False).reindex(daily["date"]).values
    mock_rate = grp.apply(lambda g: (g["aggression"] >= 0.5).mean() * 100, include_groups=False).reindex(
        daily["date"]).values
    temp_avg = grp["temp_c"].mean().reindex(daily["date"]).values

    daily["혐오율"] = np.nan_to_num(hate_rate)
    daily["조롱율"] = np.nan_to_num(mock_rate)
    daily["temp_avg"] = np.nan_to_num(temp_avg)

    return kpi, daily