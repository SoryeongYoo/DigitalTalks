import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 인증 상태 변경 감지 (한 번만 설정)
  useEffect(() => {
    console.log('[AuthContext] Firebase Auth 구독 시작');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] 인증 상태 변경:', user ? 'logged in' : 'logged out');
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = { uid: user.uid, ...userSnap.data() };
            setCurrentUser(userData);
            console.log('[AuthContext] Firestore 사용자 데이터 로드:', userData.username);
          } else {
            // Firestore 데이터가 없으면 Auth 정보만 사용
            setCurrentUser(user);
            console.log('[AuthContext] Auth 사용자 정보만 사용');
          }
          setCurrentView('home');
        } catch (error) {
          console.error('[AuthContext] 사용자 데이터 로드 실패:', error);
          setCurrentUser(user); // 에러 시에도 기본 사용자 정보는 설정
          setCurrentView('home');
        }
      } else {
        setCurrentUser(null);
        setCurrentView('login');
      }
      
      setLoading(false);
      console.log('[AuthContext] 로딩 완료');
    });

    return () => {
      console.log('[AuthContext] Firebase Auth 구독 해제');
      unsubscribe();
    };
  }, []); // 🔥 빈 의존성 배열로 한 번만 실행

  // 🔥 액션 함수들 안정화
  const login = useCallback(async (email, password) => {
    try {
      console.log('[AuthContext] 로그인 시도:', email);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] 로그인 실패:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const signup = useCallback(async (email, password, username = '') => {
    try {
      console.log('[AuthContext] 회원가입 시도:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        username: username || email.split('@')[0],
        profileImage: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
        createdAt: serverTimestamp()
      });

      console.log('[AuthContext] 회원가입 성공');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] 회원가입 실패:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] 로그아웃');
      await signOut(auth);
      setCurrentUser(null);
      setCurrentView('login');
    } catch (error) {
      console.error('[AuthContext] 로그아웃 실패:', error);
    }
  }, []);

  const switchView = useCallback((view) => {
    console.log('[AuthContext] 뷰 변경:', view);
    setCurrentView(view);
  }, []);

  // 🔥 Context value 안정화
  const contextValue = useMemo(() => ({
    currentUser,
    currentView,
    loading,
    login,
    signup,
    logout,
    switchView,
  }), [currentUser, currentView, loading, login, signup, logout, switchView]);

  // 🔥 로딩 중에는 children을 그대로 렌더링 (레이아웃 변경 방지)
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};