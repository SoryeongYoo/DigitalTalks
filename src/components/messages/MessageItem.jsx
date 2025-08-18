import React from 'react';
import { Avatar } from '../common/Avatar';
import styles from './MessageItem.module.css';
import clsx from 'clsx';

export const MessageItem = ({ message, onClick }) => (
  <button
    onClick={() => onClick(message)}
    className={clsx(
      styles.messageItem,
      message.unread && styles.unread
    )}
  >
    <Avatar
      src={message.user.profileImage}
      alt={message.user.username}
      size='sm'
    />
    <div className={styles.userInfo}>
      <p className={styles.username}>{message.user.username}</p>
      <p className={styles.lastMessage}>{message.lastMessage}</p>
    </div>
    <div className={styles.messageTime}>
      <p className={styles.time}>{message.time}</p>
      {message.unread && <div className={styles.unreadIndicator} />}
    </div>
  </button>
);
