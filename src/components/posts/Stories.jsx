import React, { useMemo, useState, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { SAMPLE_USERS } from '../../constants/sampleData';
import styles from './Stories.module.css';

export const Stories = React.memo(() => {
  const { currentUser, isLoading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 스토리 데이터를 메모이제이션 (참조 안정성 보장)
  const stories = useMemo(() => {
    const userStory = {
      id: 'my-story',
      username: '내 스토리',
      profileImage: currentUser?.profileImage,
      isCurrentUser: true
    };

    return [userStory, ...SAMPLE_USERS];
  }, [currentUser?.profileImage]);

  // 초기 로딩 완료 후 플래그 설정
  useEffect(() => {
    if (!isLoading && isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500); // 애니메이션 완료 후
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isInitialLoad]);

  // 로딩 중일 때는 고정된 스켈레톤 표시
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.scrollContainer}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className={styles.story}>
              <div className={`${styles.avatarWrapper} ${styles.skeleton}`}>
                <div className={styles.skeletonAvatar} />
              </div>
              <div className={`${styles.username} ${styles.skeletonText}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${isInitialLoad ? styles.initialLoad : ''}`}>
      <div className={styles.scrollContainer}>
        {stories.map((story, index) => (
          <StoryItem 
            key={story.id} 
            story={story} 
            index={index}
            isInitialLoad={isInitialLoad}
          />
        ))}
      </div>
    </div>
  );
});

// 개별 스토리 아이템도 메모이제이션 (props 변경시에만 리렌더링)
const StoryItem = React.memo(({ story, index, isInitialLoad }) => {
  const style = isInitialLoad ? { 
    animationDelay: `${index * 0.05}s` // 스토리별 지연 애니메이션
  } : {};

  return (
    <div className={styles.story} style={style}>
      <div className={styles.avatarWrapper}>
        <Avatar
          src={story.profileImage}
          alt={story.username}
          size="lg"
          className={styles.avatarInner}
        />
      </div>
      <span className={styles.username}>{story.username}</span>
    </div>
  );
});

StoryItem.displayName = 'StoryItem';
Stories.displayName = 'Stories';