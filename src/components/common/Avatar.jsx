// 아바타 컴포넌트
import React from 'react';
import styles from './Avatar.module.css';
import clsx from 'clsx'; // 클래스 병합 관리

// Avatar 컴포넌트
export const Avatar = ({ src, alt, size = 'medium', className = '' }) => {
  // 크기에 따른 클래스 매핑
  const sizeClassMap = {
    sm: styles.small,
    md: styles.medium,
    lg: styles.large,
  };

  return (
    <img
      src={src}
      alt={alt}
      className={clsx(styles.avatar, sizeClassMap[size], className)}
    />
  );
};