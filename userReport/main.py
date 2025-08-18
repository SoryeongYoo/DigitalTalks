# main.py
# -*- coding: utf-8 -*-

import streamlit as st
from datetime import datetime, timedelta

# 로컬 모듈 임포트
from config import KST, DEFAULT_CAUTION_TEMP, DEFAULT_WARN_TEMP, BLUR_THRESHOLD
from firebase_db import get_firebase_manager
from simulation import generate_simulation_comments, generate_weekly_events
from data_processor import process_comments, process_weekly_data
from components import (
    thermo_icon, thermometer_3d, ig_post_card, reason_chips,
    blur_block, firebase_kpi_table
)
from charts import create_split_charts, create_combined_chart
from firebase_config import db


def setup_sidebar():
    """사이드바 설정을 처리합니다."""
    with st.sidebar:
        st.header("사용자 설정")

        # Firebase 연결 상태 표시
        firebase_manager = get_firebase_manager()
        if firebase_manager.is_connected():
            st.success("🔥 Firebase 연결됨")
        else:
            st.warning("🔥 Firebase 연결 안됨")

        st.session_state.caution_c = st.slider("주의 임계(°C)", 37.5, 39.0, DEFAULT_CAUTION_TEMP, 0.1)
        st.session_state.warn_c = st.slider("경고 임계(°C)", 38.5, 40.0, DEFAULT_WARN_TEMP, 0.1)

        st.write(":gray[데이터 소스]")
        source = st.radio("데이터 소스 선택", options=["시뮬레이션", "Firebase"], horizontal=True, index=0)

        # Firebase 사용자 선택 (Firebase 모드일 때만)
        selected_firebase_user = None
        if source == "Firebase" and firebase_manager.is_connected():
            try:
                users = firebase_manager.get_all_users()
                if users:
                    user_options = {f"{user.get('username', user['id'])[:20]} ({user['id'][:8]}...)": user['id']
                                    for user in users}
                    if user_options:
                        selected_display = st.selectbox("Firebase 사용자 선택", options=list(user_options.keys()))
                        selected_firebase_user = user_options[selected_display]

                        # 선택된 사용자 정보 표시
                        selected_user_data = next(u for u in users if u['id'] == selected_firebase_user)
                        st.write(f"**리라이팅 제안**: {selected_user_data.get('rewriting_count', 0)}")
                        st.write(f"**리라이팅 수락**: {selected_user_data.get('rewrite_accept', 0)}")

                        # 디버깅: 사용자 데이터 구조 표시
                        with st.expander("🔍 사용자 데이터 구조"):
                            st.json(selected_user_data)
                else:
                    st.warning("Firebase에 사용자 데이터가 없습니다.")
                    st.info("users 컬렉션을 확인해주세요.")
            except Exception as e:
                st.error(f"사용자 목록 조회 실패: {str(e)}")
        elif source == "Firebase":
            st.warning("Firebase 연결을 확인해주세요.")

        icon_mode = st.toggle("온도계 아이콘 모드", value=True)
        thermo_size = st.slider("아이콘 크기(px)", 80, 160, 120, 10)
        thermo_h = st.slider("온도계 높이(px)", 180, 360, 220, 10)

    return source, selected_firebase_user, icon_mode, thermo_size, thermo_h


def load_post_data(source: str, engine, firebase_user_id: str = None):
    """게시글 데이터를 로드합니다."""
    items = []
    selected_post = None

    if source == "Firebase":
        firebase_manager = get_firebase_manager()
        if firebase_manager.is_connected() and firebase_user_id:
            # Firebase에서 사용자의 댓글 데이터 가져오기
            items = firebase_manager.get_user_comments(firebase_user_id, limit=20)
            selected_post = f"Firebase-{firebase_user_id[:8]}"
        else:
            st.info("Firebase 연결이 필요하거나 사용자를 선택해주세요.")
    else:
        # 시뮬레이션 데이터
        selected_post = "SIM-POST-001"
        items = generate_simulation_comments()

    return items, selected_post


def render_post_protection_tab(source: str, engine, firebase_user_id: str, icon_mode: bool, thermo_size: int,
                               thermo_h: int):
    """게시글 보호 모드 탭을 렌더링합니다."""
    st.caption("유해온도와 블러링을 **게시글 단위**로 보여줍니다. 댓글별 게이지는 숨기고, 전체 댓글 중 유해발언 비율로 산출합니다.")

    # Firebase 모드일 때 사용자 선택 확인
    if source == "Firebase":
        if not firebase_user_id:
            st.warning("🔥 Firebase 사용자를 선택해주세요.")
            st.info("사이드바에서 'Firebase 사용자 선택' 드롭다운을 사용하세요.")
            return
        else:
            st.info(f"🔥 선택된 사용자: {firebase_user_id}")

    items, selected_post = load_post_data(source, engine, firebase_user_id)

    if not items:
        if source == "Firebase":
            st.warning("🔥 선택된 사용자의 댓글 데이터가 없습니다.")
            st.info("Firebase에서 해당 사용자의 comments 하위 컬렉션을 확인해주세요.")

            # Firebase 디버깅 정보 표시
            firebase_manager = get_firebase_manager()
            if firebase_manager.is_connected():
                with st.expander("🔍 디버깅 정보"):
                    try:
                        user_data = firebase_manager.get_user_data(firebase_user_id)
                        if user_data:
                            st.json(user_data)
                        else:
                            st.error(f"사용자 데이터를 찾을 수 없습니다: {firebase_user_id}")
                    except Exception as e:
                        st.error(f"사용자 데이터 조회 실패: {str(e)}")
        else:
            st.error("데이터를 불러올 수 없습니다.")
        return

    # 댓글 전수 분석
    results, norm_reasons, post_temp, harmful_cnt = process_comments(items)

    # 게시글 상단 카드
    st.subheader(f"게시글: {selected_post}")
    blur_post = post_temp >= BLUR_THRESHOLD

    c1, c2 = st.columns([2, 1])
    with c1:
        show = st.toggle("게시글 보기", value=not blur_post, key=f"post-toggle-{selected_post}")

        ig_caption = "이 게시글은 인스타그램 UI/UX 데모용 캡션입니다. 댓글 분석 결과에 따라 게시글 전체가 보호 모드로 흐려질 수 있어요."
        ig_post_card(
            username="insta_user",
            caption=ig_caption,
            blurred=(blur_post and not show),
            key=str(selected_post)
        )

        if blur_post and not show:
            st.info("보호 모드 적용됨 · 유해온도 39°C 이상. '게시글 보기'를 끄면 원문을 볼 수 있습니다.")

    with c2:
        if icon_mode:
            thermo_icon(post_temp, size=thermo_size)
        else:
            thermometer_3d(post_temp, height=thermo_h)

        st.markdown(f"**유해발언 비율** : {(harmful_cnt / len(items)) * 100:.1f}%  ")
        st.caption("매핑: 1%p ↑ → +0.035°C, 0% = 36.5°C, 100% = 40.0°C")

        # 사유 집계 표시
        reason_chips(norm_reasons)
        st.markdown(f":gray[유해 댓글 {harmful_cnt} / 전체 {len(items)}]")

    st.divider()

    # 댓글 목록 표시
    st.markdown("**댓글 목록** (게시글 보호 모드가 켜져도 댓글은 그대로 보임)")
    for r in results:
        with st.container():
            sev_tag = ""
            if r.get("badge") == "경고":
                sev_tag = " · :red[경고]"
            elif r.get("badge") == "주의":
                sev_tag = " · :orange[주의]"

            st.markdown(f"**@{r['author']}**{sev_tag} · :gray[{str(r['dt'])[:16]}]")
            st.write(r["text"])
            st.markdown("<hr style='border:none;height:1px;background:#eef2f7;margin:12px 0'>", unsafe_allow_html=True)


def render_weekly_report_tab(source: str, firebase_user_id: str = None):
    """주간 리포트 탭을 렌더링합니다."""
    end = datetime.now(KST)
    start = end - timedelta(days=7)

    # Firebase 실제 데이터 변수 초기화
    firebase_suggested = 0
    firebase_accepted = 0

    # 데이터 수집
    if source == "Firebase":
        firebase_manager = get_firebase_manager()
        if firebase_manager.is_connected() and firebase_user_id:
            df = firebase_manager.get_user_events(firebase_user_id, start, end)

            # Firebase 사용자 데이터에서 실제 통계 가져오기
            user_data = firebase_manager.get_user_data(firebase_user_id)
            if user_data:
                # 실제 Firebase 데이터 추출
                firebase_suggested = user_data.get('rewriting_count', 0)
                firebase_accepted = user_data.get('rewrite_accept', 0)

                st.info(f"**사용자**: {user_data.get('username', firebase_user_id)} | "
                        f"**총 리라이팅 제안**: {firebase_suggested} | "
                        f"**수락**: {firebase_accepted}")

            # 데이터 확인 및 디버깅
            st.write(f"🔍 **7일간 events 조회 결과**: {len(df)}개 발견")

            if df.empty:
                st.warning("📊 7일간 events 데이터가 없어서 시뮬레이션 데이터로 주간 리포트를 생성합니다.")
                st.info(f"조회 범위: {start.strftime('%Y-%m-%d')} ~ {end.strftime('%Y-%m-%d')}")

                # 시뮬레이션 데이터로 대체 - 3개 인자 전달
                df = generate_weekly_events(firebase_user_id, start, end)
        else:
            st.info("Firebase 연결이 필요하거나 사용자를 선택해주세요.")
            return
    else:
        # 시뮬레이션 모드 - user_id 없이 기본값 사용, 3개 인자 전달
        df = generate_weekly_events("simulation_user", start, end)

    if df.empty:
        st.info("데이터가 없습니다. '게시글 보기'에서 전송해 보거나 DB를 연결하세요.")
        return

    # 데이터 처리
    kpi, daily = process_weekly_data(df)

    # Firebase 모드일 때는 실제 Firebase 데이터 사용, 다른 모드일 때는 기존 로직 사용
    if source == "Firebase" and firebase_user_id:
        # Firebase 실제 데이터로 KPI 테이블 표시
        firebase_kpi_table(firebase_suggested, firebase_accepted)

    else:
        # 기존 로직: 시뮬레이션 또는 DB 데이터 사용
        firebase_kpi_table(kpi["total"], kpi["suggested"])

    st.markdown("<div class='card'>", unsafe_allow_html=True)

    # 차트 표시 옵션
    split_view = st.toggle("분리 보기(가독성↑)", value=True, help="표현율과 온도를 별도 차트로 나눠 보여줍니다.")

    if split_view:
        fig1, fig2 = create_split_charts(daily)
        st.plotly_chart(fig1, use_container_width=True)
        st.plotly_chart(fig2, use_container_width=True)
    else:
        fig = create_combined_chart(daily)
        st.plotly_chart(fig, use_container_width=True)

    st.markdown("</div>", unsafe_allow_html=True)


def main():
    """메인 애플리케이션을 실행합니다."""
    st.set_page_config(page_title="D‑Talks 사용자용", page_icon="🛡️", layout="wide")

    # 사이드바 설정
    source, firebase_user_id, icon_mode, thermo_size, thermo_h = setup_sidebar()

    # 메인 컨텐츠
    st.title("📈 내 주간 리포트")

    # 주간 리포트 직접 렌더링 (탭 없이)
    render_weekly_report_tab(source, firebase_user_id)

    st.caption("ⓘ 주간 리포트는 총 작성 수, 리라이팅 제안/수락/수락률, 7일간 혐오·조롱 표현율만 표시합니다.")


if __name__ == "__main__":
    main()