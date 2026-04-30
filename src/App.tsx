import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from '@/shared/useAuth';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/shared/apiClient';
import LandingPage from '@/pages/LandingPage';
import MainPage from '@/pages/MainPage';
import CreatePage from '@/pages/CreatePage';
import MainPageLayout from '@/components/main/MainPageLayout';

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
  return <MainPageLayout />;
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
        <Route path="/" element={<RootRoute />}>
          <Route index element={<MainPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <MainPageLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/main/:docId" element={<MainPage />} />
        </Route>

        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthInitializer>
  );
}

export default App;
