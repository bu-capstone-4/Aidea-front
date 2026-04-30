import { http, HttpResponse } from 'msw';
import { currentUser, tokens } from '../db';
import { requireAuth, parseCookieToken } from '../helpers';

const generateToken = () => `mock-${Math.random().toString(36).slice(2)}-${Date.now()}`;

const buildCookieHeaders = (cookies: [name: string, value: string, maxAge: number][]) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const [name, value, maxAge] of cookies) {
    const encoded = value ? encodeURIComponent(value) : '';
    headers.append('Set-Cookie', `${name}=${encoded}; Path=/; SameSite=Lax; Max-Age=${maxAge}`);
  }
  return headers;
};

export const authHandlers = [
  // GET /api/oauth2/callback/github — OAuth 완료, JWT 발급
  http.get('/api/oauth2/callback/github', () => {
    tokens.accessToken = generateToken();
    tokens.refreshToken = generateToken();

    return new HttpResponse(
      JSON.stringify({ success: true, code: null, message: '로그인 성공', data: null }),
      {
        status: 200,
        headers: buildCookieHeaders([
          ['access_token', tokens.accessToken, 1800],
          ['refresh_token', tokens.refreshToken, 1209600],
        ]),
      }
    );
  }),

  // POST /api/auth/refresh — Access Token 갱신 (body 없음, 쿠키 자동 전송)
  http.post('/api/auth/refresh', ({ request }) => {
    const refreshToken = parseCookieToken(request.headers.get('Cookie'), 'refresh_token');

    if (!refreshToken || refreshToken !== tokens.refreshToken) {
      return HttpResponse.json(
        { success: false, code: 'AUTH_003', message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    tokens.accessToken = generateToken();

    return new HttpResponse(
      JSON.stringify({ success: true, code: null, message: '토큰이 갱신되었습니다.', data: null }),
      {
        status: 200,
        headers: buildCookieHeaders([['access_token', tokens.accessToken, 1800]]),
      }
    );
  }),

  // POST /api/auth/logout — 로그아웃, 쿠키 만료
  http.post('/api/auth/logout', ({ request }) => {
    const authError = requireAuth(request);
    if (authError) return authError;

    tokens.accessToken = '';
    tokens.refreshToken = '';

    return new HttpResponse(
      JSON.stringify({ success: true, code: null, message: '로그아웃 성공', data: null }),
      {
        status: 200,
        headers: buildCookieHeaders([
          ['access_token', '', 0],
          ['refresh_token', '', 0],
        ]),
      }
    );
  }),

  // GET /api/auth/me — 내 정보 조회 (인증 상태 확인)
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
