import React from 'react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { SAMPLE_USERS } from '../../constants/sampleData';
import styles from './Stories.module.css';

export const Stories = () => {
  const { currentUser } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.scrollContainer}>
        <div className={styles.story}>
          <div className={styles.avatarWrapper}>
            <Avatar
              src={currentUser?.profileImage}
              alt="내 스토리"
              size="lg"
              className={styles.avatarInner}
            />
          </div>
          <span className={styles.username}>내 스토리</span>
        </div>

        {SAMPLE_USERS.map((user) => (
          <div key={user.id} className={styles.story}>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={user.profileImage}
                alt={user.username}
                size="lg"
                className={styles.avatarInner}
              />
            </div>
            <span className={styles.username}>{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};