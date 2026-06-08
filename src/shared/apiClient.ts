import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

const INVITATION_ERROR_MESSAGES: Record<string, string> = {
  ALREADY_MEMBER: '이미 팀스페이스에 가입된 사용자입니다.',
  ALREADY_INVITED: '이미 초대가 발송된 이메일입니다.',
  INSUFFICIENT_PERMISSION: '초대 권한이 없습니다.',
  NOT_TEAMSPACE_OWNER: '일괄 초대는 OWNER만 가능합니다.',
  INVITATION_001: '초대는 최대 8명까지 가능합니다.',
  INVITATION_EXPIRED: '초대 링크가 만료되었습니다. 초대를 다시 요청하세요.',
  INVITATION_NOT_FOUND: '유효하지 않은 초대입니다.',
};

// 목 모드(VITE_USE_REAL_AUTH !== 'true')에서는 빈 baseURL → MSW가 동일 오리진 요청을 인터셉트
// 실제 모드에서는 VITE_API_BASE_URL 사용
const baseURL =
  import.meta.env.VITE_USE_REAL_AUTH === 'true' ? (import.meta.env.VITE_API_BASE_URL ?? '') : '';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// 인터셉터 없는 인스턴스 - refresh 전용으로만 사용
const basicClient = axios.create({
  baseURL,
  withCredentials: true,
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
      // 401은 refresh 흐름이 처리. 그 외 서버/네트워크 에러는 toast로 표시.
      if (error.response?.status !== 401) {
        const data = error.response?.data as { message?: string; code?: string } | undefined;
        const customMessage = data?.code ? INVITATION_ERROR_MESSAGES[data.code] : undefined;
        const message = customMessage ?? data?.message ?? '서버와 통신 중 오류가 발생했습니다.';
        useToastStore.getState().addToast({ type: 'error', message });
      }
      return Promise.reject(error);
    }

    // /api/auth/me : 인증 상태 확인용으로 401은 정상 응답
    // /api/auth/refresh : refresh 자체가 실패한 경우
    const skipRefreshUrls = ['/api/auth/me', '/api/auth/refresh'];
    if (skipRefreshUrls.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

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
      // basicClient 사용 - 인터셉터 재진입 없이 refresh 호출
      await basicClient.post('/api/auth/refresh');
      flushQueue();
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      useAuthStore.getState().setAuthenticated(false);
      window.location.href = '/';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
