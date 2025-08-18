# charts.py
# -*- coding: utf-8 -*-

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import numpy as np
from config import PASTEL_PINK, PASTEL_ORANGE, LAVENDER, ORANGE, RED
from utils import hex_to_rgba


def create_split_charts(daily_data: pd.DataFrame):
    """표현율과 온도를 분리된 차트로 생성합니다."""
    caution = st.session_state.get("caution_c", 37.8)
    warn = st.session_state.get("warn_c", 39.0)

    # 상단: 혐오/조롱 표현율
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(
        x=daily_data["date"],
        y=daily_data.get("혐오율", []),
        mode="lines+markers",
        name="혐오율",
        line=dict(color=PASTEL_PINK, width=4, shape="spline", smoothing=1.05),
        marker=dict(size=7, color=PASTEL_PINK, line=dict(color="#fff", width=2)),
        hovertemplate="%{x|%Y-%m-%d}<br>혐오율: %{y:.1f}%<extra></extra>"
    ))
    fig1.add_trace(go.Scatter(
        x=daily_data["date"],
        y=daily_data.get("조롱율", []),
        mode="lines+markers",
        name="조롱율",
        line=dict(color=PASTEL_ORANGE, width=4, shape="spline", smoothing=1.05),
        marker=dict(size=7, color=PASTEL_ORANGE, line=dict(color="#fff", width=2)),
        hovertemplate="%{x|%Y-%m-%d}<br>조롱율: %{y:.1f}%<extra></extra>"
    ))

    fig1.update_yaxes(range=[0, 100], ticksuffix='%', gridcolor="#EEF2F7", title_text="", tickangle=0)
    fig1.update_xaxes(gridcolor="#F3F4F6", tickfont=dict(size=16))
    fig1.update_layout(
        height=230,
        margin=dict(l=90, r=10, t=10, b=0),
        legend=dict(orientation='h', x=0, y=1.15),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    fig1.add_annotation(
        text="표현율(%)", xref="paper", yref="paper", x=-0.07, y=0.5,
        xanchor="left", yanchor="middle", showarrow=False,
        font=dict(size=13, color="#6b7280")
    )

    # 하단: 평균 유해온도
    temp_avg = daily_data.get("temp_avg", [])
    fig2 = go.Figure()
    fig2.add_hrect(y0=caution, y1=warn, fillcolor=hex_to_rgba(ORANGE, 0.08), line_width=0)
    fig2.add_hrect(y0=warn, y1=40.0, fillcolor=hex_to_rgba(RED, 0.08), line_width=0)
    fig2.add_trace(go.Scatter(
        x=daily_data["date"],
        y=temp_avg,
        mode="lines+markers",
        name="평균 유해온도",
        line=dict(color=LAVENDER, width=5, shape="spline", smoothing=1.05),
        marker=dict(size=8, color=LAVENDER, line=dict(color="#fff", width=2)),
        hovertemplate="%{x|%Y-%m-%d}<br>평균 온도: %{y:.2f}°C<extra></extra>"
    ))

    fig2.add_hline(y=warn, line=dict(color=RED, dash="dash"))
    fig2.add_hline(y=caution, line=dict(color=ORANGE, dash="dot"))

    if len(daily_data):
        x_last = daily_data["date"].iloc[-1]
        fig2.add_annotation(
            x=x_last, y=warn, text=f"경고 {warn:.1f}°C", showarrow=False,
            font=dict(color=RED, size=12), xanchor="right", yanchor="bottom", xshift=-4
        )
        fig2.add_annotation(
            x=x_last, y=caution, text=f"주의 {caution:.1f}°C", showarrow=False,
            font=dict(color=ORANGE, size=12), xanchor="right", yanchor="top", xshift=-4
        )

    fig2.update_yaxes(range=[36.5, 40.0], gridcolor="#EEF2F7", title_text="", tickangle=0)
    fig2.update_xaxes(gridcolor="#F3F4F6", tickfont=dict(size=16))
    fig2.update_layout(
        height=230,
        margin=dict(l=90, r=10, t=10, b=0),
        legend=dict(orientation='h', x=0, y=1.15),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    fig2.add_annotation(
        text="온도(°C)", xref="paper", yref="paper", x=-0.07, y=0.5,
        xanchor="left", yanchor="middle", showarrow=False,
        font=dict(size=13, color="#6b7280")
    )

    return fig1, fig2


def create_combined_chart(daily_data: pd.DataFrame):
    """표현율과 온도를 하나의 차트로 결합합니다."""
    caution = st.session_state.get("caution_c", 37.8)
    warn = st.session_state.get("warn_c", 39.0)
    temp_avg = daily_data.get("temp_avg", [])

    fig = go.Figure()

    # 레이아웃 설정
    fig.update_layout(
        yaxis=dict(title="", range=[0, 100], ticksuffix='%', gridcolor="#EEF2F7", tickangle=0),
        yaxis2=dict(
            title="", range=[36.5, 40.0], overlaying='y', side='right', showgrid=False,
            titlefont=dict(color=LAVENDER), tickfont=dict(color=LAVENDER), tickangle=0
        ),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        height=340,
        margin=dict(l=90, r=90, t=20, b=0),
        legend=dict(orientation='h', x=0, y=1.12)
    )
    fig.update_xaxes(gridcolor="#F3F4F6", tickfont=dict(size=16))

    # 비율 트레이스 (왼쪽 y축)
    fig.add_trace(go.Scatter(
        x=daily_data["date"],
        y=daily_data.get("혐오율", []),
        mode="lines+markers",
        name="혐오율",
        line=dict(color=PASTEL_PINK, width=4, shape="spline", smoothing=1.05),
        marker=dict(size=6, color=PASTEL_PINK, line=dict(color="#fff", width=2))
    ))
    fig.add_trace(go.Scatter(
        x=daily_data["date"],
        y=daily_data.get("조롱율", []),
        mode="lines+markers",
        name="조롱율",
        line=dict(color=PASTEL_ORANGE, width=4, shape="spline", smoothing=1.05),
        marker=dict(size=6, color=PASTEL_ORANGE, line=dict(color="#fff", width=2))
    ))

    # 평균 온도 (오른쪽 y축)
    fig.add_trace(go.Scatter(
        x=daily_data["date"],
        y=temp_avg,
        mode="lines+markers",
        yaxis="y2",
        name="평균 유해온도",
        line=dict(color=LAVENDER, width=5, shape="spline", smoothing=1.05),
        marker=dict(size=8, color=LAVENDER, line=dict(color="#fff", width=2))
    ))

    # 기준선
    fig.add_hline(y=caution, line=dict(color=ORANGE, dash="dot"), yref="y2")
    fig.add_hline(y=warn, line=dict(color=RED, dash="dash"), yref="y2")

    # 축 타이틀 주석
    fig.add_annotation(
        text="표현율(%)", xref="paper", yref="paper", x=-0.07, y=0.5,
        xanchor="left", yanchor="middle", showarrow=False,
        font=dict(size=13, color="#6b7280")
    )
    fig.add_annotation(
        text="온도(°C)", xref="paper", yref="paper", x=1.07, y=0.5,
        xanchor="right", yanchor="middle", showarrow=False,
        font=dict(size=13, color=LAVENDER)
    )

    return fig