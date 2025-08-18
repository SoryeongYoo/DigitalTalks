import React from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';
import clsx from 'clsx';

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={clsx(styles.modal, className)}>
        {title && (
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button onClick={onClose} className={styles.closeButton}>
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};