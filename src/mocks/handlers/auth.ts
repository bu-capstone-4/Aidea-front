import { http, HttpResponse, passthrough } from 'msw';
import { currentUser, session } from '../db';
import { requireAuth } from '../helpers';

const USE_REAL_AUTH = import.meta.env.VITE_USE_REAL_AUTH === 'true';

export const authHandlers = [
  // POST /api/dev/mock-login — MSW 목 모드 전용: 세션 시작 (실제 OAuth 대체)
  http.post('/api/dev/mock-login', () => {
    session.isLoggedIn = true;
    return HttpResponse.json({ success: true, code: null, message: '목 로그인 성공', data: null });
  }),

  // POST /api/auth/refresh — 세션 기반이므로 로그인 상태면 항상 성공
  http.post('/api/auth/refresh', () => {
    if (USE_REAL_AUTH) return passthrough();

    if (!session.isLoggedIn) {
      return HttpResponse.json(
        { success: false, code: 'AUTH_003', message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      code: null,
      message: '토큰이 갱신되었습니다.',
      data: null,
    });
  }),

  // POST /api/auth/logout — 세션 종료
  http.post('/api/auth/logout', () => {
    if (USE_REAL_AUTH) return passthrough();

    const authError = requireAuth();
    if (authError) return authError;

    session.isLoggedIn = false;

    return HttpResponse.json({
      success: true,
      code: null,
      message: '로그아웃 성공',
      data: null,
    });
  }),

  // GET /api/auth/me — 내 정보 조회 (인증 상태 확인)
  http.get('/api/auth/me', () => {
    if (USE_REAL_AUTH) return passthrough();

    const authError = requireAuth();
    if (authError) return authError;

    return HttpResponse.json({
      success: true,
      code: null,
      message: null,
      data: currentUser,
    });
  }),
];
