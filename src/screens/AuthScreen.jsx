// 인증 화면
import React from 'react';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuth} from '../hooks/useAuth';
import { VIEWS } from '../constants/views';

const AuthScreen = () => {
  const { currentView, login, signup, switchView } = useAuth();

  const handleAuth = (username, emailOrPassword, password) => {
    if (currentView === VIEWS.LOGIN) {
      return login(username, emailOrPassword);
    } else {
      return signup(username, emailOrPassword, password);
    }
  };

  const handleSwitchMode = () => {
    switchView(currentView === VIEWS.LOGIN ? VIEWS.SIGNUP : VIEWS.LOGIN);
  };

  return (
    <AuthForm
      type={currentView === VIEWS.LOGIN ? 'login' : 'signup'}
      onSubmit={handleAuth}
      onSwitchMode={handleSwitchMode}
    />
  );
};

export default AuthScreen;