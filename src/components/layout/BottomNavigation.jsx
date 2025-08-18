import React from 'react';
import { Home, Search, PlusSquare, Heart, User, Send, LogOut } from 'lucide-react';
import styles from './BottomNavigation.module.css';
import { useUI } from '../../hooks/useUI';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const BottomNavigation = () => {
  const { openDM } = useUI();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return(
    <nav className={styles.sidebar}>
      <div className={styles.container}>
        <button onClick={() => { navigate('/'); console.log('Navigating to home'); }}>
          <img 
          src="/img/instagram_text.png"
          alt="Instagram Logo"
          className={styles.logo}
          />
        </button>
        <button 
          className={`${styles.navButton} ${styles.active}`}
          onClick={() => navigate('/')}
        >
          <Home className={styles.icon} />
          <span className={styles.label}>홈</span>
        </button>
        <button className={styles.navButton}>
          <Search className={styles.icon} />
          <span className={styles.label}>검색</span>
        </button>
        <button className={styles.navButton}>
          <img
            src="/img/investigation_logo.png"
            alt="investigation logo"
            className={styles.icon} />
          <span className={styles.label}>탐색탭</span>
        </button>
        <button className={styles.navButton}>
          <img
            src="/img/reels_logo.png"
            alt="Investigation Logo"
            className={styles.icon} />
          <span className={styles.label}>릴스</span>
        </button>
        <button
          onClick={() => navigate('/dm')} 
          className={styles.navButton}>
          <Send className={styles.icon} />
          <span className={styles.label}>메세지</span>
        </button>
        <button className={styles.navButton}>
          <PlusSquare className={styles.icon} />
          <span className={styles.label}>만들기</span>
        </button>
        <button className={styles.navButton}>
          <Heart className={styles.icon} />
          <span className={styles.label}>알림</span>
        </button>
        <button className={styles.navButton}>
          <User className={styles.icon} />
          <span className={styles.label}>사용자 대시보드</span>
        </button>
        <button 
          onClick={logout}
          className={styles.navButton}
        >
          <LogOut className={styles.icon} />
          <span className={styles.label}>로그아웃</span>
        </button>
      </div>
    </nav>
  )
};
