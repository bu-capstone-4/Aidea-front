/**
 * Cloudflare Pages Functions — 백엔드 동일 오리진 프록시
 *
 * 프론트(*.pages.dev)와 백엔드(*.duckdns.org)는 서로 다른 site라서 인증 쿠키가 서드파티 쿠키가 된다.
 * iOS Safari(ITP)는 SameSite=None이어도 서드파티 쿠키를 차단하므로 로그인이 유지되지 않는다.
 * 브라우저가 프론트 오리진에만 요청하도록 API·OAuth·WebSocket 경로를 백엔드로 그대로 전달해
 * 쿠키를 first-party로 만든다.
 *
 * 함수가 실행되는 경로는 public/_routes.json에서 제한한다(정적 파일 요청은 무료 한도에서 제외).
 * 아래 접두사 목록은 _routes.json이 누락돼도 정적 파일이 백엔드로 새지 않게 하는 이중 안전장치다.
 */

interface Env {
  BACKEND_ORIGIN?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}

const DEFAULT_BACKEND_ORIGIN = 'https://aidea-bu.duckdns.org';

const PROXY_PATH_PREFIXES = ['/api/', '/oauth2/', '/login/oauth2/', '/ws/'];

export const onRequest = async ({ request, env, next }: PagesContext): Promise<Response> => {
  const { pathname, search } = new URL(request.url);
  if (!PROXY_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return next();

  const target = new URL(pathname + search, env.BACKEND_ORIGIN ?? DEFAULT_BACKEND_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete('host');

  try {
    // redirect: 'manual' — OAuth 302(Location + Set-Cookie)를 프록시가 따라가지 않고 브라우저에 그대로 넘긴다.
    // WebSocket 업그레이드 요청도 같은 fetch로 백엔드와 연결되고, 101 응답을 반환하면 그대로 중계된다.
    return await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    });
  } catch {
    return new Response('Bad Gateway', { status: 502 });
  }
};
