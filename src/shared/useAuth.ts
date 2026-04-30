import { useNavigate } from 'react-router';
import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { isAuthenticated, isLoading, setAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const login = async () => {
    try {
      await apiClient.get('/api/oauth2/callback/github');
      setAuthenticated(true);
      navigate('/');
    } catch (error) {
      setAuthenticated(false);
      // TODO: toast 시스템 도입 시 에러 메시지 표시로 교체
      console.error('로그인에 실패했습니다.', error);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      setAuthenticated(false);
      navigate('/');
    }
  };

  return { isAuthenticated, isLoading, login, logout };
}
