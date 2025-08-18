// 메인 앱 컴포넌트
import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import { PostProvider } from './contexts/PostsContext';
import { UIProvider } from './contexts/UIContext';
import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import MessageScreen from './components/messages/MessageScreen';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation } from './components/layout/BottomNavigation';

const InstagramClone = () => {
  return (
    (
      <Router>
        <AuthProvider>
          <UIProvider>
            <PostProvider>
              <AppContent />
            </PostProvider>
          </UIProvider>
        </AuthProvider>
      </Router>
    )
  );
};

const AppContent = () => {
  // 현재 사용자 정보를 가져오는 훅
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 사용자 정보가 변경될 때마다 콘솔에 출력
  React.useEffect(() => {
    console.log('Current User:', currentUser);
  }, [currentUser]);

  // 현재 사용자가 있으면 홈 화면을, 없으면 인증 화면을 렌더링
  return (
    <>
      <Routes>
        <Route path='/' element={currentUser ? <HomeScreen /> : <Navigate to="/auth" />} />
        <Route path='/auth' element={<AuthScreen />} />
        <Route path='/dm' element={<MessageScreen />} />
      </Routes>
      {currentUser && location.pathname !== '/auth' && <BottomNavigation />}
    </>
  );
};

export default InstagramClone;
