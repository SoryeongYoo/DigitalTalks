import React from 'react';
import styles from './ChatMessage.module.css';
import clsx from 'clsx';

export const ChatMessage = ({ message, isOwn }) => {
  return (
    <div className={clsx(styles.messageWrapper, {
      [styles.own]: isOwn,
      [styles.other]: !isOwn
    })}>
      <div className={clsx(styles.messageBubble, {
        [styles.ownBubble]: isOwn,
        [styles.otherBubble]: !isOwn
      })}>
        <p className={styles.messageText}>{message.message}</p>
      </div>
      {message.timestamp && (
        <div className={styles.messageTime}>
          <span className={styles.timestamp}>{message.timestamp}</span>
        </div>
      )}
    </div>
  );
};

