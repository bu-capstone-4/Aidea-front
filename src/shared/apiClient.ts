import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 쿠키 자동 전송
});

// ── Response interceptor: 401 시 refresh 후 재요청 ────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

const flushQueue = (error?: unknown) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // refresh 시도 없이 그냥 에러를 반환할 엔드포인트
    // /api/auth/me : 인증 상태 확인용으로 401은 정상 응답
    // /api/auth/refresh : refresh 자체가 실패한 경우
    const skipRefreshUrls = ['/api/auth/me', '/api/auth/refresh'];
    if (skipRefreshUrls.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    // 이미 갱신 중이면 대기열에 추가
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // body 없음 — refresh_token 쿠키가 자동으로 전송됨
      await apiClient.post('/api/auth/refresh');
      flushQueue();
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      useAuthStore.getState().setAuthenticated(false);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
