import React, { useMemo, useEffect, useState } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Avatar } from '../common/Avatar';
import styles from './PostHeader.module.css';
import { FaThermometerFull, FaThermometerHalf, FaThermometerEmpty } from "react-icons/fa";

export const PostHeader = ({ 
  user = {}, 
  timeAgo = null, 
  createdAt = null, 
  postId = null,
  onTempChange = null
}) => {
  const [harmfulTemp, setHarmfulTemp] = useState(36.5);

  const username = user.username || '익명';
  const avatarSrc = user.profileImage || undefined;

  // 특정 게시물 실시간 구독
  useEffect(() => {
    if (!postId) return;

    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists()) {
        const temp = snap.data().harmfulTemp ?? 36.5;
        setHarmfulTemp(temp);
        if (onTempChange) onTempChange(temp);
      }
    });

    return () => unsub();
  }, [postId, onTempChange]);

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

  const ThermometerIcon = () => {
    if (harmfulTemp < 36.5) return <FaThermometerEmpty size={20} color="green" />;
    if (harmfulTemp < 38) return <FaThermometerHalf size={20} color="orange" />;
    return <FaThermometerFull size={20} color="red" />;
  };

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

      {/* 🔥 유해 온도 표시 */}
      <div className={styles.temperature}>
        <ThermometerIcon />
        <span>{harmfulTemp.toFixed(1)}°C</span>
      </div>

      {/* ✅ 더보기 버튼 복구 */}
      <button className={styles.moreButton} aria-label="더보기">
        <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
    </div>
  );
};
