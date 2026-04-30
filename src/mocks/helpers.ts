import { HttpResponse } from 'msw';
import { tokens } from './db';

export const parseCookieToken = (cookieHeader: string | null, key: string): string | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export function requireAuth(request: Request): Response | null {
  const token = parseCookieToken(request.headers.get('Cookie'), 'access_token');

  if (!token || token !== tokens.accessToken) {
    return HttpResponse.json(
      { success: false, code: 'AUTH_003', message: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  return null;
}
