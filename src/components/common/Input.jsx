// 입력 컴포넌트
import React from 'react';
import styles from './Input.module.css';
import clsx from 'clsx';

export const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={clsx(styles.input, className)}
      {...props}
    />
  );
};