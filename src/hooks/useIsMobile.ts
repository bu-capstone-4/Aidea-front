import { useSyncExternalStore } from 'react';

// Tailwind v4 `max-md:`(`not all and (width >= 48rem)`)와 같은 조건이어야 CSS와 JS 판정이 일치한다.
// `(max-width: 767px)`는 뷰포트 폭이 767.x px(소수)일 때 false가 되어 경계에서 어긋난다.
const MOBILE_QUERY = '(width < 48rem)';

export function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, isMobileViewport);
}
