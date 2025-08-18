# components.py
# -*- coding: utf-8 -*-

import streamlit as st
import streamlit.components.v1 as components
from typing import Dict
from config import SEVERITY_COLOR, RED, ORANGE
from utils import severity_from_temp


def thermo_icon(temp_c: float, size: int = 120):
    """작은 아이콘형 온도계. 귀엽고 컴팩트하게 게시글 옆에 놓기 좋음."""
    sev = severity_from_temp(temp_c)
    color = SEVERITY_COLOR[sev]
    min_t, max_t = 36.5, 40.0
    ratio = max(0.0, min(1.0, (float(temp_c) - min_t) / (max_t - min_t)))
    tube_h = int(size * 0.68)
    tube_w = int(size * 0.14)
    bulb_d = int(size * 0.36)
    fill_h = int(tube_h * ratio)

    html = """
    <div class='ticon'>
      <div class='cap'></div>
      <div class='tube'>
        <div class='fill' style='height:{fill_h}px;background:linear-gradient(180deg,{color} 0%, {color}cc 80%, {color}bb 100%);'></div>
      </div>
      <div class='bulb'></div>
      <div class='label' style='color:{color}'>{temp:.2f}°C</div>
    </div>
    <style>
    .ticon{{position:relative;width:{w}px;height:{h}px;display:flex;flex-direction:column;align-items:center;}}
    .tube{{position:relative;width:{tw}px;height:{th}px;border-radius:{tw}px;background:linear-gradient(90deg,#eef2f7,#ffffff 55%,#e9eef5);
          box-shadow:inset 4px 0 8px rgba(0,0,0,.06), inset -4px 0 8px rgba(0,0,0,.04);overflow:hidden}}
    .fill{{position:absolute;left:0;bottom:0;width:100%;box-shadow:inset 0 6px 10px rgba(255,255,255,.35)}}
    .bulb{{width:{bd}px;height:{bd}px;border-radius:50%;margin-top:6px;
           background:radial-gradient(35% 35% at 32% 32%, #fff6f6 0%, #ffd1d1 35%, #ff7b7b 55%, #e74c3c 80%);
           box-shadow:inset -10px -12px 18px rgba(0,0,0,.18), 0 8px 16px rgba(0,0,0,.18)}}
    .cap{{width:{tw}px;height:8px;border-radius:8px;background:linear-gradient(180deg,#fafbfd,#e5eaf1);margin-bottom:6px}}
    .label{{margin-top:6px;font-weight:800;font-size:14px}}
    </style>
    """.format(
        color=color, fill_h=fill_h, temp=temp_c,
        w=max(tube_w, bulb_d), h=tube_h + bulb_d + 26, tw=tube_w, th=tube_h, bd=bulb_d
    )
    components.html(html, height=tube_h + bulb_d + 40)


def thermometer_3d(temp_c: float, height: int = 260):
    """3D 느낌의 세로 온도계 (HTML/CSS 기반)."""
    sev = severity_from_temp(temp_c)
    color = SEVERITY_COLOR[sev]
    min_t, max_t = 36.5, 40.0
    rng = max_t - min_t

    # 높이 계산
    fill_h = max(0, min(1, (float(temp_c) - min_t) / rng)) * height
    caution = st.session_state.get("caution_c", 37.8)
    warn = st.session_state.get("warn_c", 39.0)
    cau_h = max(0, min(1, (caution - min_t) / rng)) * height
    warn_h = max(0, min(1, (warn - min_t) / rng)) * height

    # 라벨(간격 넓힘: 1.0°C 라벨 + 보조 눈금은 생략)
    labels = [40.0, 39.5, 38.5, 37.5, 36.5]
    tick_items = "".join(
        "<div class='tick' style='--y:{:.6f};'><span>{:.1f}</span></div>".format((v - min_t) / rng, v)
        for v in labels
    )

    html = """
    <div class='thermo-wrap'>
      <div class='thermo'>
        <div class='tube'>
          <div class='fill' style='height:{fill_h}px; background: linear-gradient(90deg, {color}cc, {color});'></div>
          <div class='marker caution' style='bottom:{cau_h}px'></div>
          <div class='marker warn' style='bottom:{warn_h}px'></div>
        </div>
        <div class='bulb'></div>
        <div class='cap'></div>
      </div>
      <div class='ticks' style='height:{height}px'>
        {tick_items}
      </div>
    </div>
    <div class='readout' style='color:{color}'>{temp:.2f}°C · 유해도 {sev}</div>

    <style>
    .thermo-wrap{{display:flex;align-items:center;gap:24px;margin:4px 0 6px;}}
    .thermo{{position:relative;width:92px;height:{outer_h}px}}
    .tube{{position:absolute;left:28px;bottom:64px;width:36px;height:{height}px;border-radius:20px; 
          background: linear-gradient(90deg,#eef2f7 0%,#ffffff 50%,#e9eef5 100%);
          box-shadow: inset 5px 0 10px rgba(0,0,0,.06), inset -5px 0 10px rgba(0,0,0,.04), 0 6px 12px rgba(0,0,0,.06);
          overflow:hidden;}}
    .fill{{position:absolute;left:0;bottom:0;width:100%;
          box-shadow: inset 0 -4px 10px rgba(255,255,255,.45), inset 0 8px 14px rgba(0,0,0,.08);}} 
    .bulb{{position:absolute;left:12px;bottom:0;width:68px;height:68px;border-radius:50%;
          background: radial-gradient(35% 35% at 32% 32%, #fff6f6 0%, #ffd1d1 35%, #ff7b7b 55%, #e74c3c 80%);
          box-shadow: inset -10px -12px 18px rgba(0,0,0,.18), 0 10px 18px rgba(0,0,0,.18);}} 
    .cap{{position:absolute;left:28px;bottom:{cap_bottom}px;width:36px;height:10px;border-radius:12px; 
         background: linear-gradient(180deg,#fafbfd,#e5eaf1); box-shadow: 0 -2px 6px rgba(0,0,0,.05);}} 
    .marker{{position:absolute;left:20px;width:52px;height:2px}}
    .marker.caution{{background:#F39C12}}
    .marker.warn{{background:#E74C3C}}
    .ticks{{display:flex;flex-direction:column;justify-content:space-between;gap:0;color:#64748b;}}
    .tick{{position:relative;}}
    .tick span{{display:block;min-width:28px;text-align:center;font-size:12px}}
    .readout{{font-weight:800;margin-top:6px}}
    </style>
    """.format(
        fill_h=int(fill_h),
        color=color,
        cau_h=int(cau_h),
        warn_h=int(warn_h),
        height=int(height),
        outer_h=int(height + 80),
        cap_bottom=int(height + 64),
        tick_items=tick_items,
        temp=temp_c,
        sev=sev,
    )
    components.html(html, height=height + 120)


def ig_post_card(username: str, caption: str, blurred: bool, key: str, height: int = 360):
    """인스타그램 스타일 게시글 카드 업그레이드 버전."""
    blur_css = "filter: blur(7px);" if blurred else "filter:none;"
    badge = "" if not blurred else "<div class='badge'>🛡️ 보호됨</div>"
    safe_caption = caption.replace("<", "&lt;").replace(">", "&gt;")

    html = """
    <div class='igwrap'>
      <div class='igcard'>
        <div class='ighd'>
          <div class='ring'><div class='ava'></div></div>
          <div class='name'>{username}</div>
          <div class='dots'>•••</div>
        </div>
        <div class='igcontent' style='{blur_css}'>
          <div class='media' style='height:{h}px'>{badge}</div>
          <div class='actions'>
            <div class='left'><span class='ico'>❤</span><span class='ico'>💬</span><span class='ico'>✈</span></div>
            <div class='right'>⤴</div>
          </div>
          <div class='likes'>좋아요 1,024개</div>
          <div class='caption'><b>{username}</b> {caption}</div>
          <div class='time'>2시간 전</div>
        </div>
      </div>
    </div>
    <style>
      .igwrap{{padding:4px 0;}}
      .igcard{{border:1px solid #e5e7eb;border-radius:16px;background:#fff;overflow:hidden;
               box-shadow:0 8px 20px rgba(2,6,23,.06);max-width:520px}}
      .ighd{{display:flex;align-items:center;gap:10px;padding:10px 12px}}
      .ring{{width:34px;height:34px;border-radius:50%;padding:2px;background:conic-gradient(#f99,#f6c,#f99);
             display:flex;align-items:center;justify-content:center}}
      .ava{{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);
            box-shadow:inset 0 0 0 2px #fff}}
      .name{{font-weight:700;color:#111827;flex:1}}
      .dots{{color:#9ca3af;font-weight:700}}
      .igcontent{{position:relative;transition:filter .2s ease}}
      .media{{position:relative;background:linear-gradient(135deg,#f3f4f6,#e5e7eb);}}
      .badge{{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.55);color:#fff;
              padding:4px 8px;border-radius:999px;font-size:12px}}
      .actions{{display:flex;justify-content:space-between;padding:8px 12px 0 12px;color:#111827}}
      .ico{{margin-right:10px;filter:grayscale(.2)}}
      .likes{{padding:0 12px;font-weight:700;color:#111827}}
      .caption{{padding:6px 12px 10px 12px;color:#374151;white-space:pre-wrap;line-height:1.5}}
      .time{{padding:0 12px 12px 12px;font-size:12px;color:#9ca3af}}
    </style>
    """.format(username=username, blur_css=blur_css, h=int(height), caption=safe_caption, badge=badge)
    components.html(html, height=height + 180)


def reason_chips(reasons: Dict[str, float]):
    """유해성 사유를 칩 형태로 표시합니다."""
    chips = []
    for k, v in reasons.items():
        if k == "혐오":
            col = RED
        elif k == "조롱/모욕":
            col = ORANGE
        else:
            col = "#9b59b6"  # 비하 purple
        pct = int(round(v * 100))
        chips.append(
            f"<span style='background:{col}1a;color:{col};padding:.25rem .6rem;"
            f"border-radius:999px;font-weight:700;font-size:.75rem;margin-right:.35rem'>"
            f"{k} {pct}%</span>"
        )
    st.markdown(" ".join(chips), unsafe_allow_html=True)


def blur_block(text: str, temp_c: float, key: str):
    """텍스트를 블러 처리하여 표시합니다."""
    from config import BLUR_THRESHOLD

    blurred = temp_c >= BLUR_THRESHOLD  # 고정: 39°C 이상만 블러
    toggle = st.toggle("원문 보기", value=not blurred, key=f"toggle-{key}")
    style = "filter: blur(6px);" if (blurred and not toggle) else "filter:none;"

    st.markdown(
        f"""
        <div style='padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:white'>
           <div style='{style};white-space:pre-wrap;line-height:1.55'>{text}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


def blur_block(text: str, temp_c: float, key: str):
    """텍스트를 블러 처리하여 표시합니다."""
    from config import BLUR_THRESHOLD

    blurred = temp_c >= BLUR_THRESHOLD  # 고정: 39°C 이상만 블러
    toggle = st.toggle("원문 보기", value=not blurred, key=f"toggle-{key}")
    style = "filter: blur(6px);" if (blurred and not toggle) else "filter:none;"

    st.markdown(
        f"""
        <div style='padding:12px;border:1px solid #e5e7eb;border-radius:14px;background:white'>
           <div style='{style};white-space:pre-wrap;line-height:1.55'>{text}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


def firebase_kpi_table(suggested: int, accepted: int):
    """Firebase 사용자 데이터를 KPI 테이블 스타일로 표시합니다."""
    accept_rate = (accepted / max(suggested, 1)) * 100

    kpi_html = f"""
    <div class='kpi-grid'>
      <table class='kpi-table'>
        <thead>
          <tr>
            <th>리라이팅 제안</th>
            <th>리라이팅 수락</th>
            <th>수락률</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class='num'>{suggested}</td>
            <td class='num'>{accepted}</td>
            <td class='num'>{accept_rate:.1f}%</td>
          </tr>
        </tbody>
      </table>
    </div>
    <style>
      .kpi-grid{{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(2,6,23,.06);}}
      .kpi-table{{width:100%;border-collapse:separate;border-spacing:0;background:#fff;margin:0 auto;}}
      .kpi-table th{{padding:12px 14px;text-align:center;color:#6b7280;font-weight:700;border-bottom:1px solid #eef2f7;font-size:14px}}
      .kpi-table td{{padding:16px 14px;text-align:center;color:#111827;font-weight:800;border-bottom:1px solid #f3f4f6;font-size:18px}}
      .kpi-table .num{{font-variant-numeric:tabular-nums}}
    </style>
    """
    st.markdown(kpi_html, unsafe_allow_html=True)
