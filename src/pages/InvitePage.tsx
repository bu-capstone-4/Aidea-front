import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '@/shared/useAuth';
import { apiClient } from '@/shared/apiClient';
import { useToastStore } from '@/store/toastStore';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      useToastStore
        .getState()
        .addToast({ type: 'error', message: '유효하지 않은 초대 링크입니다.' });
      navigate('/', { replace: true });
      return;
    }

    if (isLoading) return;

    if (isAuthenticated) {
      apiClient
        .post('/api/invitations/accept', { token })
        .then((res) => {
          const { docId } = res.data.data as { docId: string };
          navigate(docId ? `/main/${docId}` : '/', { replace: true });
        })
        .catch(() => {
          navigate('/', { replace: true });
        });
    } else {
      localStorage.setItem('pending_invite_token', token);
      login();
    }
  }, [isLoading, isAuthenticated, token, navigate, login]);

  return null;
}
