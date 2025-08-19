import React, { useState, useMemo, useCallback } from 'react';
import { PostHeader } from './PostHeader.jsx';
import { PostActions } from './PostActions.jsx';
import { usePosts } from '../../hooks/usePost.js';
import { useUI } from '../../hooks/useUI.js';
import styles from './Post.module.css';
import CommentsModal from '../comments/CommentsModal.jsx';

export const Post = React.memo(({ post }) => {
  const { toggleLike } = usePosts();
  const { openComments, activeCommentPostId } = useUI();

  const [harmfulTemp, setHarmfulTemp] = useState(36.5);
  const [revealed, setRevealed] = useState(false);

  // 댓글 모달 상태 메모이제이션
  const isCommentOpen = useMemo(() => 
    String(activeCommentPostId) === String(post?.id), 
    [activeCommentPostId, post?.id]
  );

  // 사용자 정보 메모이제이션 최적화
  const headerUser = useMemo(() => {
    const raw = post?.user;
    const username =
      typeof raw === 'string'
        ? raw
        : (raw?.username ?? raw?.name ?? raw?.handle ?? post?.instagram_id ?? '익명');

    const profileImage =
      post?.profileImage
      || (typeof raw === 'object' ? (raw?.avatar ?? raw?.profileImage) : null)
      || null;

    return { username, profileImage };
  }, [post?.user, post?.profileImage, post?.instagram_id]);

  // blur 상태 메모이제이션
  const shouldBlur = useMemo(() => harmfulTemp >= 38, [harmfulTemp]);

  // 이미지 소스 메모이제이션
  const imageSrc = useMemo(() => 
    post?.image || post?.imageUrl || null, 
    [post?.image, post?.imageUrl]
  );

  // 콜백 함수들 최적화
  const handleTempChange = useCallback((temp) => {
    setHarmfulTemp(temp);
  }, []);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleLike = useCallback(() => {
    toggleLike(post.id);
  }, [toggleLike, post.id]);

  const handleComment = useCallback(() => {
    openComments(post?.id);
  }, [openComments, post?.id]);

  return (
    <div className={styles.post}>
      <PostHeader
        user={headerUser}
        timeAgo={post?.timeAgo ?? ''}
        postId={post?.id}
        onTempChange={handleTempChange}
      />

      {/* 이미지 영역 */}
      <div className={styles.imageContainer}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Post"
            className={`${styles.image} ${(shouldBlur && !revealed) ? styles.blurred : ''}`}
            loading="lazy" // 성능 최적화
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}

        {/* 경고 오버레이 */}
        {shouldBlur && !revealed && (
          <div
            className={styles.warningOverlay}
            onClick={handleReveal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleReveal();
              }
            }}
          >
            ⚠️ 유해 표현 감지됨. 클릭하면 내용을 확인할 수 있어요.
          </div>
        )}
      </div>

      <PostActions
        post={post}
        onLike={handleLike}
        onComment={handleComment}
      />

      {isCommentOpen && <CommentsModal postId={post?.id} />}
    </div>
  );
});

Post.displayName = 'Post';