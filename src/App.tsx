import { useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams, useNavigate } from 'react-router';
import { useAuth } from '@/shared/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { apiClient } from '@/shared/apiClient';
import LandingPage from '@/pages/LandingPage';
import MainPage from '@/pages/MainPage';
import CreatePage from '@/pages/CreatePage';
import InvitePage from '@/pages/InvitePage';
import ToastContainer from '@/components/ui/ToastContainer';

const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  INVITATION_EXPIRED: '초대 링크가 만료되었습니다. 초대를 다시 요청하세요.',
  INVITATION_NOT_FOUND: '유효하지 않은 초대입니다.',
  INVITATION_EMAIL_MISMATCH: '초대받은 이메일 계정으로 로그인하세요.',
  ALREADY_MEMBER: '이미 팀원입니다.',
  INTERNAL_ERROR: '오류가 발생했습니다. 잠시 후 다시 시도하세요.',
};

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuthenticated, setLoading } = useAuthStore();

  useEffect(() => {
    apiClient
      .get('/api/auth/me')
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, [setAuthenticated, setLoading]);

  return <>{children}</>;
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (!errorCode) return;

    const message = ACCEPT_ERROR_MESSAGES[errorCode] ?? '초대 처리 중 오류가 발생했습니다.';
    useToastStore.getState().addToast({ type: 'error', message });

    setSearchParams(
      (prev) => {
        prev.delete('error');
        return prev;
      },
      { replace: true }
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('pending_invite_token');
    if (!token) return;

    localStorage.removeItem('pending_invite_token');
    apiClient
      .post('/api/invitations/accept', { token })
      .then((res) => {
        const { docId } = res.data.data as { docId: string };
        if (docId) navigate(`/main/${docId}`, { replace: true });
      })
      .catch(() => {
        // 에러 toast는 apiClient 인터셉터 처리
      });
  }, [isAuthenticated]);

  if (isLoading) return null;
  if (!isAuthenticated) return <LandingPage />;
  return <MainPage />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthInitializer>
      <Routes>
        <Route path="/" element={<RootRoute />} />

        <Route
          path="/main/:docId"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />

        <Route path="/invite" element={<InvitePage />} />
      </Routes>
      <ToastContainer />
    </AuthInitializer>
  );
}

export default App;
