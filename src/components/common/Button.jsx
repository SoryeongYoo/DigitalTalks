// 버튼 컴포넌트
import React from 'react';
import styles from './Button.module.css';
import clsx from 'clsx'; //클래스 병합 관리

export const Button = ({
  variant = 'primary', // primary | secondary | ghost
  size = 'medium',     // small | medium | large
  children,
  className = '',
  ...props
}) => {
  const computedClassName = clsx(
    styles.button,
    styles[variant],
    styles[size],
    className
  );

  return (
    <button className={computedClassName} {...props}>
      {children}
    </button>
  );
};