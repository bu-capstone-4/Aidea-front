import { http, HttpResponse } from 'msw';
import { currentUser, tokens } from '../db';
import { requireAuth } from '../helpers';

const generateAccessToken = () =>
  `mock-access-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const generateRefreshToken = () =>
  `mock-refresh-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export const authHandlers = [
  // GET /api/oauth2/callback/:provider — 소셜 로그인 콜백 (신규 토큰 발급)
  http.get('/api/oauth2/callback/:provider', () => {
    tokens.accessToken = generateAccessToken();
    tokens.refreshToken = generateRefreshToken();

    const redirectUrl = new URL('/oauth/callback', window.location.origin);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return new HttpResponse(null, {
      status: 302,
      headers: { Location: redirectUrl.toString() },
    });
  }),

  // POST /api/auth/refresh — Access Token 갱신
  http.post('/api/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };

    if (!tokens.refreshToken || body.refreshToken !== tokens.refreshToken) {
      return HttpResponse.json(
        { success: false, code: 'AUTH_003', message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    tokens.accessToken = generateAccessToken();

    return HttpResponse.json({
      success: true,
      code: null,
      message: '토큰이 갱신되었습니다.',
      data: { ...tokens },
    });
  }),

  // POST /api/auth/logout — 로그아웃
  http.post('/api/auth/logout', ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    tokens.accessToken = '';
    tokens.refreshToken = '';

    return HttpResponse.json({
      success: true,
      code: null,
      message: '로그아웃 성공',
      data: null,
    });
  }),

  // GET /api/auth/me — 내 정보 조회
  http.get('/api/auth/me', ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    return HttpResponse.json({
      success: true,
      code: null,
      message: null,
      data: currentUser,
    });
  }),
];
