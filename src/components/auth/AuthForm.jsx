import React, { use, useEffect, useState } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import styles from './AuthForm.module.css';
import { auth, db } from '../../firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

export const AuthForm = ({ type, onSwitchMode }) => {
  const navigate = useNavigate();

  // 입력 폼 상태 관리(username, email, password)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    // 초기화: 폼 데이터 리셋
    setFormData({
      username: '',
      email: '',
      password: ''
    });
  }, [type]); // type이 변경될 때마다 초기화

 
  const [error, setError] = useState('');

  // 특정 필드의 입력 값 변경 시 상태 업데이트 함수
  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // 로그인 또는 가입 버튼 클릭 시 호출되는 함수
  const handleSubmit = async () => {
    setError('');
    const { username, email, password } = formData;

    try {
      if (type === 'login') {
        // 1. 이메일+비밀번호 로그인 시도
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 2. Firestore에서 해당 유저 문서 불러오기
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        // 3. 유저 문서가 존재하는지 확인
        if (!userDocSnap.exists()) {
          // 회원 정보 없음 → 비정상 상황
          await signOut(auth);
          throw new Error('회원 정보를 찾을 수 없습니다.');
        }

        // 4. 사용자 정보를 가져와서 상태 업데이트
        const storedUsername = userDocSnap.data().username;

        // 5. 입력한 username과 DB username 비교
        if (storedUsername !== username) {
          // 불일치 → 로그아웃 및 에러 표시
          await signOut(auth);
          throw new Error('사용자 이름이 일치하지 않습니다.');
        }

        console.log('로그인 성공!');
        navigate('/'); // 홈 이동
      } else {

        // 회원가입
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Firebase Auth에 displayName 설정
        await updateProfile(userCredential.user, {
          displayName: username,
        });

        const db = getFirestore(); // 초기화

        // Firestore에 사용자 정보 저장
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username,
          email: email,
          profileImage: 'https://cdn-icons-png.flaticon.com/512/847/847969.png', // 기본 프로필 이미지
          createdAt: new Date()
        });

        await signOut(auth);
        alert('회원가입 성공! 로그인 해주세요.');
      }
    } catch (err) {
      console.error('인증 오류:', err);
      setError(err.message);
    }
  };

  // Enter 키를 눌렀을 때 로그인 또는 가입 함수 호출
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // 로그인 또는 가입 버튼 활성화 여부 판단
  const isValid = formData.username && formData.email && formData.password;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <img
              src='/img/instagram_text.png'
              alt='Instagram Logo'
              className={styles.logo}
            />
            <p className={styles.subtitle}>
              {type === 'login'
                ? '친구들의 사진과 동영상을 보려면 로그인하세요.'
                : '친구들의 사진과 동영상을 보려면 가입하세요.'}
            </p>
          </div>

          <div className={styles.form}>
            <Input
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange('email')}
              onKeyPress={handleKeyPress}
            />
            <Input
              type="text"
              placeholder="사용자 닉네임"
              value={formData.username}
              onChange={handleChange('username')}
              onKeyPress={handleKeyPress}
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange('password')}
              onKeyPress={handleKeyPress}
            />
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              {type === 'login' ? '로그인' : '가입하기'}
            </Button>

            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>

        <div className={styles.switchCard}>
          <p className={styles.switchText}>
            {type === 'login' ? '계정이 없으신가요?' : '계정이 있으신가요?'}{' '}
            <button
              onClick={onSwitchMode}
              className={styles.switchLink}
            >
              {type === 'login' ? '가입하기' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
