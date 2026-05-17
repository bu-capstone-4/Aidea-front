import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/shared/useAuth';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/shared/apiClient';
import LandingPage from '@/pages/LandingPage';
import MainPage from '@/pages/MainPage';
import CreatePage from '@/pages/CreatePage';
import ToastContainer from '@/components/ui/ToastContainer';

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
      </Routes>
      <ToastContainer />
    </AuthInitializer>
  );
}

export default App;
