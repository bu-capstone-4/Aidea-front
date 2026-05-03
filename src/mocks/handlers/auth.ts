import { http, HttpResponse } from 'msw';
import { currentUser, session } from '../db';
import { requireAuth } from '../helpers';

export const authHandlers = [
  // GET /api/oauth2/callback/github — OAuth 완료, 세션 시작
  http.get('/api/oauth2/callback/github', () => {
    session.isLoggedIn = true;

    return HttpResponse.json({
      success: true,
      code: null,
      message: '로그인 성공',
      data: null,
    });
  }),

  // POST /api/auth/refresh — 세션 기반이므로 로그인 상태면 항상 성공
  http.post('/api/auth/refresh', () => {
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
