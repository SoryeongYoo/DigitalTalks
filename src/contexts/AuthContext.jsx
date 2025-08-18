// AuthContext.jsx
import React, { createContext, useEffect, useState, useCallback } from 'react';
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

  // 로그인 상태 유지 + Firestore에서 유저 데이터 가져오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setCurrentUser({ uid: user.uid, ...userSnap.data() });
        } else {
          // Firestore 데이터가 없으면 Auth 정보만 세팅
          setCurrentUser(user);
        }
        setCurrentView('home');
      } else {
        setCurrentUser(null);
        setCurrentView('login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 로그인 함수
  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // 회원가입 함수
  const signup = useCallback(async (email, password, username = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        username: username || email.split('@')[0],
        profileImage: 'https://cdn-icons-png.flaticon.com/512/847/847969.png', // 기본 프로필 이미지
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('login');
  }, []);

  // 현재 뷰 변경
  const switchView = useCallback((view) => {
    setCurrentView(view);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentView,
        loading,
        login,
        signup,
        logout,
        switchView,
      }}
    >
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};
