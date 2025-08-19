import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Avatar } from '../common/Avatar';
import styles from './PostHeader.module.css';
import { FaThermometerFull, FaThermometerHalf, FaThermometerEmpty } from "react-icons/fa";

export const PostHeader = React.memo(({ 
  user = {}, 
  timeAgo = null, 
  createdAt = null, 
  postId = null,
  onTempChange = null
}) => {
  const [harmfulTemp, setHarmfulTemp] = useState(36.5);
  const onTempChangeRef = useRef(onTempChange);
  const lastTempRef = useRef(36.5);

  // onTempChange 콜백 안정화
  onTempChangeRef.current = onTempChange;

  const username = user.username || '익명';
  const avatarSrc = user.profileImage || undefined;

  // 온도 변경 핸들러 최적화 (불필요한 업데이트 방지)
  const handleTempChange = useCallback((newTemp) => {
    const rounded = Math.round(newTemp * 10) / 10; // 소수점 1자리로 반올림
    
    // 이전 값과 다를 때만 업데이트
    if (Math.abs(rounded - lastTempRef.current) > 0.05) {
      lastTempRef.current = rounded;
      setHarmfulTemp(rounded);
      
      // 부모 컴포넌트에 알림 (디바운스 적용)
      if (onTempChangeRef.current) {
        onTempChangeRef.current(rounded);
      }
    }
  }, []);

  // Firebase 구독 최적화
  useEffect(() => {
    if (!postId) return;

    let timeoutId = null;
    
    const unsub = onSnapshot(
      doc(db, "posts", postId), 
      (snap) => {
        if (snap.exists()) {
          const temp = snap.data().harmfulTemp ?? 36.5;
          
          // 디바운스 적용 (100ms 내 연속 업데이트 방지)
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            handleTempChange(temp);
          }, 100);
        }
      },
      (error) => {
        console.error(`PostHeader Firebase error for post ${postId}:`, error);
      }
    );

    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [postId, handleTempChange]);

  // 시간 표시 메모이제이션 강화
  const displayTime = useMemo(() => {
    if (createdAt instanceof Date) {
      const diff = Date.now() - createdAt.getTime();
      if (diff >= 24*60*60*1000) return createdAt.toLocaleDateString('ko-KR');
      const s = Math.floor(diff/1000);
      if (s < 60) return `${s}초 전`;
      const m = Math.floor(s/60);
      if (m < 60) return `${m}분 전`;
      const h = Math.floor(m/60);
      return `${h}시간 전`;
    }
    if (typeof timeAgo === 'string' && timeAgo) return timeAgo;
    return null;
  }, [createdAt, timeAgo]);

  // 온도계 아이콘 메모이제이션
  const ThermometerIcon = useMemo(() => {
    if (harmfulTemp < 36.5) return <FaThermometerEmpty size={20} color="green" />;
    if (harmfulTemp < 38) return <FaThermometerHalf size={20} color="orange" />;
    return <FaThermometerFull size={20} color="red" />;
  }, [harmfulTemp]);

  return (
    <div className={styles.header}>
      <div className={styles.userInfo}>
        <Avatar 
          src={avatarSrc || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} 
          alt={username} 
          size="sm" 
          className={styles.avatar} 
        />
        <div>
          <span className={styles.username}>{username}</span>
          {displayTime && <span className={styles.timestamp}> • {displayTime}</span>}
        </div>
      </div>

      {/* 온도 표시 최적화 */}
      <div className={styles.temperature}>
        {ThermometerIcon}
        <span>{harmfulTemp.toFixed(1)}°C</span>
      </div>

      <button className={styles.moreButton} aria-label="더보기">
        <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>
  );
});

PostHeader.displayName = 'PostHeader';