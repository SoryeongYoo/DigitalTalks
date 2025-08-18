# firebase_config.py
import streamlit as st
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:  # 중복 초기화 방지
    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": st.secrets["firebase"]["projectId"],
        "private_key_id": st.secrets["firebase"]["privateKeyId"],
        "private_key": st.secrets["firebase"]["privateKey"].replace('\\n', '\n'),
        "client_email": st.secrets["firebase"]["clientEmail"],
        "client_id": st.secrets["firebase"]["clientId"],
        "auth_uri": st.secrets["firebase"]["authUri"],
        "token_uri": st.secrets["firebase"]["tokenUri"],
        "auth_provider_x509_cert_url": st.secrets["firebase"]["authProviderCertUrl"],
        "client_x509_cert_url": st.secrets["firebase"]["clientCertUrl"]
    })
    firebase_admin.initialize_app(cred)

db = firestore.client()
