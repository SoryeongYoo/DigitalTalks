import React, { useState, useMemo } from 'react';
import { PostHeader } from './PostHeader.jsx';
import { PostActions } from './PostActions.jsx';
import { usePosts } from '../../hooks/usePost.js';
import { useUI } from '../../hooks/useUI.js';
import styles from './Post.module.css';
import CommentsModal from '../comments/CommentsModal.jsx';

export const Post = ({ post }) => {
  const { toggleLike } = usePosts();
  const { openComments, activeCommentPostId } = useUI();

  const [harmfulTemp, setHarmfulTemp] = useState(36.5);  // 🔥 PostHeader가 업데이트해줌
  const isCommentOpen = String(activeCommentPostId) === String(post?.id);

  const [revealed, setRevealed] = useState(false);  // 사용자가 열었는지 여부

  const headerUser = React.useMemo(() => {
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
  }, [post]);

  // 🔥 blur 여부
  const shouldBlur = harmfulTemp >= 38;

  const imageSrc = post?.image || post?.imageUrl || null;

  return (
    <div className={styles.post}>
      <PostHeader
        user={headerUser}
        timeAgo={post?.timeAgo ?? ''}
        postId={post?.id}
        onTempChange={setHarmfulTemp}   // 🔥 PostHeader에서 temp 올려줌
      />

      {/* 이미지 영역 */}
      <div className={styles.imageContainer}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Post"
            className={`${styles.image} ${(shouldBlur && !revealed) ? styles.blurred : ''}`}
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}

        {/* 경고 오버레이 */}
        {shouldBlur && !revealed && (
          <div
            className={styles.warningOverlay}
            onClick={() => setRevealed(true)}   // 🔥 클릭하면 해제
          >
            ⚠️ 유해 표현 감지됨. 클릭하면 내용을 확인할 수 있어요.
          </div>
        )}
      </div>


      <PostActions
        post={post}
        onLike={toggleLike}
        onComment={() => openComments(post?.id)}
      />

      {isCommentOpen && <CommentsModal postId={post?.id} />}
    </div>
  );
};
