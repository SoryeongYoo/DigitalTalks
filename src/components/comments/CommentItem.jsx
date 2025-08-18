// components/comments/CommentItem.jsx
import React from 'react';
import { Avatar } from '../common/Avatar';
import styles from './CommentItem.module.css';
import clsx from 'clsx';

const timeAgo = (ts) => {
  if (!ts) return '방금 전';
  const date =
    ts?.seconds ? new Date(ts.seconds * 1000) :
    ts instanceof Date ? ts :
    new Date(ts);

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

export const CommentItem = ({ comment, canDelete = false, onDelete }) => (
  <div className={styles.comment}>
    <Avatar
      src={comment.profileImage || 'https://cdn-icons-png.flaticon.com/512/847/847969.png'}
      alt={comment.user}
      size="sm"
    />
    <div className={styles.content}>
      <div className={styles.main}>
        <span className={styles.username}>{comment.user}</span>
        <span className={styles.text}>{comment.text}</span>
        {canDelete && (
          <button
            type="button"
            className={styles.deleteBtn} // CSS 모듈에 작게/회색으로 스타일 추천
            onClick={onDelete}
            aria-label="댓글 삭제"
          >
            삭제
          </button>
        )}
      </div>
      <div className={styles.timestamp}>{timeAgo(comment.createdAt)}</div>
    </div>
  </div>
);
