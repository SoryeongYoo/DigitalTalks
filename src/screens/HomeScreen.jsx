import React, { useEffect } from 'react';
import { usePosts } from '../hooks/usePost';
import { Header } from '../components/layout/Header';
import { Stories } from '../components/posts/Stories';
import { Post } from '../components/posts/Post';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import styles from './HomeScreen.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomeScreen = () => {
  const { posts } = usePosts();
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  // 로그인 상태 확인
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login'); // 로그인 안 됐으면 로그인 화면으로
    }
  }, [loading, currentUser, navigate]);

  // Firebase 인증 체크 중 로딩 화면
  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.mainContent}>
        <Stories />
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
          />
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default HomeScreen;
