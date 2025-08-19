import React, { useEffect, useMemo } from 'react';
import { usePosts } from '../hooks/usePost';
import { Header } from '../components/layout/Header';
import { Stories } from '../components/posts/Stories';
import { Post } from '../components/posts/Post';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import styles from './HomeScreen.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Stories를 메모이제이션으로 완전히 분리
const MemoizedStories = React.memo(Stories);

// Posts 리스트도 메모이제이션
const PostsList = React.memo(({ posts }) => {
  return (
    <>
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </>
  );
});

const HomeScreen = () => {
  const { posts, isLoading: postsLoading } = usePosts();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // 로그인 상태 확인 (메모이제이션으로 불필요한 체크 방지)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login');
    }
  }, [authLoading, currentUser, navigate]);

  // posts 배열 안정화 (참조 변경 최소화)
  const stablePosts = useMemo(() => {
    return posts || [];
  }, [posts]);

  // Firebase 인증 체크 중 로딩 화면
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자는 빈 화면 (navigate가 처리)
  if (!currentUser) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.mainContent}>
        {/* Stories는 posts 로딩과 완전히 독립적으로 렌더링 */}
        <div className={styles.storiesSection}>
          <MemoizedStories />
        </div>
        
        {/* Posts 섹션 분리 */}
        <div className={styles.postsSection}>
          {postsLoading ? (
            <div className={styles.postsLoading}>
              {/* 포스트 스켈레톤 UI */}
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.postSkeleton}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonAvatar}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonActions}></div>
                </div>
              ))}
            </div>
          ) : (
            <PostsList posts={stablePosts} />
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

PostsList.displayName = 'PostsList';

export default HomeScreen;