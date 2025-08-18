
import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import styles from './PostActions.module.css';
import clsx from 'clsx';

export const PostActions = ({ post, onLike, onComment }) => {
  // 안전한 값들로 매핑
  const likesCount = Number(post?.likes ?? 0);
  const isLiked = Boolean(post?.isLiked);

  // 사용자 이름과 캡션 기본값 설정
  const username =
    post?.instagram_id ??
    '익명';
  const caption = post?.caption ?? post?.content ?? '';
  const commentCount = Number(post?.commentCount ?? post?.comments?.length ?? 0);

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <button
            onClick={() => onLike(post.id)}
            className={clsx(styles.actionButton, styles.heartButton)}
            aria-pressed={isLiked}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
          >
            <Heart
              className={clsx(styles.icon, {
                [styles.liked]: isLiked,
                [styles.notLiked]: !isLiked,
              })}
            />
          </button>

          <button
            onClick={() => onComment(post.id)}
            className={styles.actionButton}
            aria-label="댓글 보기"
          >
            <MessageCircle className={styles.icon} />
          </button>

          <button className={styles.actionButton} aria-label="공유하기">
            <Send className={styles.icon} />
          </button>
        </div>

        <button className={styles.actionButton} aria-label="북마크">
          <Bookmark className={styles.icon} />
        </button>
      </div>

      <p className={styles.likesText}>좋아요</p>

      <p className={styles.caption}>
        <span className={styles.username}>{username}</span>
        {caption}
      </p>

      <div className={styles.leftGroup}>
        {commentCount > 0 && (
          <button
            onClick={() => onComment(post.id)}
            className={styles.viewCommentsButton}
          >
            댓글 {commentCount.toLocaleString('ko-KR')}개 모두 보기
          </button>
        )}
      </div>
    </div>
  );
};
