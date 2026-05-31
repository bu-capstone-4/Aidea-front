import { useToastStore } from '@/store/toastStore';
import type {
  DocumentSocketErrorCode,
  FeedbackErrorCode,
  TeamspaceSocketErrorCode,
} from '@/types/socket';
import type { BacklogSocketErrorCode } from '@/types/backlog';

type KnownSocketErrorCode =
  | DocumentSocketErrorCode
  | FeedbackErrorCode
  | TeamspaceSocketErrorCode
  | BacklogSocketErrorCode;

// 세션 종료가 필요한 치명적 코드
const FATAL_CODES = new Set<string>(['UNAUTHORIZED', 'SESSION_EXPIRED']);

const ERROR_MESSAGES: Partial<Record<KnownSocketErrorCode, string>> = {
  // 문서 소켓
  DOCUMENT_LOCKED: '현재 AI 피드백이 진행 중입니다. 피드백 완료 후 편집해 주세요.',
  INSUFFICIENT_PERMISSION: '이 작업을 수행할 권한이 없습니다.',
  DOCUMENT_NOT_FOUND: '문서를 찾을 수 없습니다.',
  UNAUTHORIZED: '인증이 만료되었습니다. 다시 로그인해 주세요.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  INTERNAL_SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  INVALID_MESSAGE: '잘못된 요청입니다.',
  // 피드백 에러
  AI_FEEDBACK_FAILED: 'AI 피드백 생성에 실패했습니다.',
  AI_TIMEOUT: 'AI 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
  CONTENT_EMPTY: '문서 내용이 없어 피드백을 생성할 수 없습니다.',
};

export interface SocketErrorPayload {
  code: string;
  message: string;
}

/**
 * 소켓 에러 이벤트를 toast로 표시하고, 치명적 에러(UNAUTHORIZED/SESSION_EXPIRED)는
 * onFatal 콜백을 호출합니다. onFatal을 전달하지 않으면 로그인 페이지로 리다이렉트합니다.
 */
export function handleSocketError(error: SocketErrorPayload, onFatal?: () => void): void {
  const message = ERROR_MESSAGES[error.code as KnownSocketErrorCode] ?? error.message;

  useToastStore.getState().addToast({ type: 'error', message });

  if (FATAL_CODES.has(error.code)) {
    if (onFatal) {
      onFatal();
    } else {
      window.location.href = '/';
    }
  }
}

export function isFatalSocketError(code: string): boolean {
  return FATAL_CODES.has(code);
}
