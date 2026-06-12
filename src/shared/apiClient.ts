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

// PATCH .../members/{memberId}/role 에서 발생 가능한 에러
const ROLE_CHANGE_ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_PERMISSION: '권한 변경은 소유자(Owner)만 할 수 있습니다.',
  NOT_TEAMSPACE_OWNER: '권한 변경은 소유자(Owner)만 할 수 있습니다.',
  NOT_TEAMSPACE_MEMBER: '대상이 팀스페이스 멤버가 아닙니다.',
  TEAMSPACE_LAST_OWNER: '팀스페이스에는 최소 1명의 소유자가 있어야 합니다.',
  INVALID_INPUT: '잘못된 역할 값입니다.',
};

// PUT .../backlog/config 에서 generateDraft=true 요청 시 발생 가능한 에러
const BACKLOG_DRAFT_ERROR_MESSAGES: Record<string, string> = {
  BACKLOG_DRAFT_NOT_FIRST_CREATION: '백로그 설정이 이미 존재하여 초안을 생성할 수 없습니다.',
  BACKLOG_DRAFT_BLOCKED_BY_DOCUMENT_DRAFT: '문서 AI 생성이 끝난 후 다시 시도해주세요.',
  BACKLOG_DRAFT_NO_PLANNING_DOCUMENT: '먼저 기획 문서를 작성해주세요.',
  BACKLOG_DRAFT_ALREADY_IN_PROGRESS: '이미 백로그 초안 생성이 진행 중입니다.',
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
        const isRoleChangeRequest = /\/members\/[^/]+\/role$/.test(originalRequest.url ?? '');
        const customMessage = data?.code
          ? isRoleChangeRequest
            ? ROLE_CHANGE_ERROR_MESSAGES[data.code]
            : (INVITATION_ERROR_MESSAGES[data.code] ?? BACKLOG_DRAFT_ERROR_MESSAGES[data.code])
          : undefined;
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
