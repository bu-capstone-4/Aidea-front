import { HttpResponse } from 'msw';
import { tokens } from './db';

export function requireAuth(request: Request): Response | null {
  const auth = request.headers.get('Authorization');

  if (!auth?.startsWith('Bearer ')) {
    return HttpResponse.json(
      { success: false, code: 'AUTH_001', message: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const token = auth.slice(7);

  if (!tokens.accessToken || token !== tokens.accessToken) {
    return HttpResponse.json(
      { success: false, code: 'AUTH_003', message: '유효하지 않은 토큰입니다.' },
      { status: 401 }
    );
  }

  return null;
}
