import { apiClient } from './apiClient';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/github`;
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
