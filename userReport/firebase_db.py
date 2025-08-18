# firebase_db.py
# -*- coding: utf-8 -*-

import os
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import streamlit as st

try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    st.error("Firebase Admin SDK가 설치되지 않았습니다. `pip install firebase-admin`을 실행하세요.")

from config import KST


class FirebaseManager:
    """Firebase Firestore 연결 및 데이터 관리 클래스"""

    def __init__(self):
        self.db = None
        self.initialized = False
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Firebase 초기화"""
        if not FIREBASE_AVAILABLE:
            return

        try:
            # 이미 초기화되었는지 확인
            if firebase_admin._apps:
                self.db = firestore.client()
                self.initialized = True
                return

            cred = None

            # 1. Streamlit Secrets에서 Firebase 설정 로드 (우선순위)
            try:
                if hasattr(st, 'secrets') and 'firebase' in st.secrets:
                    cred = credentials.Certificate(dict(st.secrets['firebase']))
                    st.success("✅ Streamlit Secrets에서 Firebase 설정을 로드했습니다.")
            except Exception as e:
                st.info(f"Streamlit Secrets 로드 실패: {str(e)}")

            # 2. 서비스 계정 키 파일 경로 (환경변수에서 가져오기)
            if cred is None:
                service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
                if service_account_path and os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    st.success(f"✅ 서비스 계정 키 파일에서 Firebase 설정을 로드했습니다: {service_account_path}")

            # 3. 환경변수에서 JSON 문자열로 로드
            if cred is None:
                service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                if service_account_json:
                    service_account_info = json.loads(service_account_json)
                    cred = credentials.Certificate(service_account_info)
                    st.success("✅ 환경변수 JSON에서 Firebase 설정을 로드했습니다.")

            # 설정이 없는 경우
            if cred is None:
                st.info("🔥 Firebase 설정이 없습니다. 시뮬레이션 모드를 사용하세요.")
                st.info("Firebase 연결이 필요한 경우 아래 방법 중 하나를 선택하세요:")
                st.info("1. `.streamlit/secrets.toml` 파일 생성")
                st.info("2. 환경변수 `FIREBASE_SERVICE_ACCOUNT_KEY` 설정")
                st.info("3. 환경변수 `FIREBASE_SERVICE_ACCOUNT_JSON` 설정")
                return

            # Firebase 앱 초기화
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            self.initialized = True
            st.success("🔥 Firebase 초기화 완료!")

        except Exception as e:
            st.warning(f"Firebase 초기화 실패: {str(e)}")
            st.info("시뮬레이션 모드를 사용하세요.")

    def is_connected(self) -> bool:
        """Firebase 연결 상태 확인"""
        return self.initialized and self.db is not None

    def get_user_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """특정 사용자의 데이터를 가져옵니다."""
        if not self.is_connected():
            return None

        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()

            if user_doc.exists:
                return user_doc.to_dict()
            return None

        except Exception as e:
            st.error(f"사용자 데이터 조회 실패: {str(e)}")
            return None

    def get_all_users(self) -> List[Dict[str, Any]]:
        """모든 사용자 목록을 가져옵니다."""
        if not self.is_connected():
            return []

        try:
            users_ref = self.db.collection('users')
            users = users_ref.stream()

            user_list = []
            for user in users:
                user_data = user.to_dict()
                user_data['id'] = user.id
                user_list.append(user_data)

            return user_list

        except Exception as e:
            st.error(f"사용자 목록 조회 실패: {str(e)}")
            return []

    def get_user_events(self, user_id: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """특정 사용자의 이벤트 데이터를 가져옵니다 (주간 리포트용)."""
        if not self.is_connected():
            return pd.DataFrame()

        try:
            # users/{user_id}/events 하위 컬렉션에서 데이터 조회
            events_ref = (self.db.collection('users')
                          .document(user_id)
                          .collection('events')
                          .where('createdAt', '>=', start_date)
                          .where('createdAt', '<=', end_date)
                          .order_by('createdAt'))

            events = events_ref.stream()

            rows = []
            for event in events:
                event_data = event.to_dict()

                # Firestore Timestamp를 datetime으로 변환
                created_at = event_data.get('createdAt')
                if hasattr(created_at, 'seconds'):  # Firestore Timestamp
                    created_at = datetime.fromtimestamp(created_at.seconds, tz=KST)

                rows.append({
                    'id': event.id,
                    'created_at': created_at,
                    'user_id': user_id,
                    'raw_text': event_data.get('rawText', ''),
                    'suggestion': event_data.get('suggestion', ''),
                    'toxicity': event_data.get('toxicity', 0.0),
                    'aggression': event_data.get('aggression', 0.0),
                    'hate': event_data.get('hate', 0.0),
                    'temp_c': event_data.get('tempC', 36.5),
                    'sent_choice': event_data.get('sentChoice', '원문'),
                })

            return pd.DataFrame(rows)

        except Exception as e:
            st.error(f"이벤트 데이터 조회 실패: {str(e)}")
            return pd.DataFrame()

    def get_user_comments(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """특정 사용자의 최근 댓글들을 가져옵니다."""
        if not self.is_connected():
            return []

        try:
            # users/{user_id}/comments 하위 컬렉션에서 최근 댓글 조회
            comments_ref = (self.db.collection('users')
                            .document(user_id)
                            .collection('comments')
                            .order_by('createdAt', direction=firestore.Query.DESCENDING)
                            .limit(limit))

            comments = comments_ref.stream()

            comment_list = []
            for comment in comments:
                comment_data = comment.to_dict()

                # Firestore Timestamp를 datetime으로 변환
                created_at = comment_data.get('createdAt')
                if hasattr(created_at, 'seconds'):
                    created_at = datetime.fromtimestamp(created_at.seconds, tz=KST)
                elif isinstance(created_at, str):
                    # 문자열인 경우 파싱 시도
                    try:
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00')).astimezone(KST)
                    except:
                        created_at = datetime.now(KST)
                else:
                    created_at = datetime.now(KST)

                comment_list.append({
                    'id': comment.id,
                    'author': user_id,
                    'text': comment_data.get('text', ''),
                    'dt': created_at,
                    'post_id': comment_data.get('postId', 'unknown'),
                })

            # 댓글이 없는 경우 시뮬레이션 데이터 생성
            if not comment_list:
                st.info(f"🔥 사용자 {user_id}의 comments 컬렉션이 비어있습니다. 테스트용 샘플 데이터를 생성합니다.")
                # 시뮬레이션 댓글 생성
                sample_comments = [
                    "Firebase 연결 테스트용 댓글입니다.",
                    "실제 데이터가 없어서 샘플을 보여드립니다.",
                    "Firebase 구조를 확인해보세요.",
                ]

                for i, text in enumerate(sample_comments):
                    comment_list.append({
                        'id': f'sample_{i}',
                        'author': user_id,
                        'text': text,
                        'dt': datetime.now(KST),
                        'post_id': 'sample_post',
                    })

            return comment_list

        except Exception as e:
            st.error(f"댓글 데이터 조회 실패: {str(e)}")
            # 에러 발생 시에도 샘플 데이터 반환
            return [{
                'id': 'error_sample',
                'author': user_id,
                'text': f'Firebase 조회 중 오류 발생: {str(e)}',
                'dt': datetime.now(KST),
                'post_id': 'error_post',
            }]

    def update_user_stats(self, user_id: str, rewriting_count: int = None, rewrite_accept: int = None):
        """사용자의 리라이팅 통계를 업데이트합니다."""
        if not self.is_connected():
            return False

        try:
            user_ref = self.db.collection('users').document(user_id)

            update_data = {}
            if rewriting_count is not None:
                update_data['rewriting_count'] = rewriting_count
            if rewrite_accept is not None:
                update_data['rewrite_accept'] = rewrite_accept

            if update_data:
                user_ref.update(update_data)
                return True

            return False

        except Exception as e:
            st.error(f"사용자 통계 업데이트 실패: {str(e)}")
            return False

    def add_event(self, user_id: str, event_data: Dict[str, Any]):
        """새로운 이벤트를 추가합니다."""
        if not self.is_connected():
            return False

        try:
            events_ref = self.db.collection('users').document(user_id).collection('events')

            # 현재 시간을 createdAt으로 설정
            event_data['createdAt'] = datetime.now(KST)

            events_ref.add(event_data)
            return True

        except Exception as e:
            st.error(f"이벤트 추가 실패: {str(e)}")
            return False


# 전역 Firebase 매니저 인스턴스
firebase_manager = FirebaseManager()


def get_firebase_manager() -> FirebaseManager:
    """Firebase 매니저 인스턴스를 반환합니다."""
    return firebase_manager