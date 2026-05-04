import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { isAuthenticated, isLoading, setAuthenticated } = useAuthStore();

  const login = () => {
    if (import.meta.env.VITE_USE_REAL_AUTH === 'true') {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/github`;
    } else {
      // MSW 목 모드: mock-login 엔드포인트로 세션 설정
      apiClient.post('/api/dev/mock-login').then(() => setAuthenticated(true));
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      window.location.href = '/';
    }
  };

  return { isAuthenticated, isLoading, login, logout };
}
