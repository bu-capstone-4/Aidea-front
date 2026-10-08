import * as Y from 'yjs';
import { base64ToUint8Array } from '@/shared/base64';

// AI 질문 답변 전용 Y.Doc 레지스트리 (qaId = feedbackId | draftId).
// 문서 소켓(useCollabEditor)은 editable 변화 등으로 자주 재연결되므로,
// 답변 Y.Doc의 수명은 소켓과 분리해 모듈 레벨에서 관리하고 소켓은 "현재 송신 함수"만 바인딩한다.

// "직접 입력" 라디오를 선택했음을 나타내는 choice 값
export const CUSTOM_CHOICE = '__custom__';

const CHOICE_MAP_NAME = 'choice';

// 질문별 텍스트는 루트 타입으로 둔다 — Y.Map 안에 Y.Text를 중첩 생성하면 동시 생성 시 한쪽이 LWW로 사라진다
export function qaTextName(questionId: string): string {
  return `text:${questionId}`;
}

export function getQaChoiceMap(doc: Y.Doc): Y.Map<string> {
  return doc.getMap<string>(CHOICE_MAP_NAME);
}

type QaSender = (qaId: string, update: Uint8Array) => void;

const REMOTE_ORIGIN = Symbol('qa-remote');

const docs = new Map<string, Y.Doc>();
// 제출·종료된 qaId — 지연 도착한 qa:update로 Y.Doc이 다시 만들어지지 않게 막는다
const closedQaIds = new Set<string>();
let currentSender: QaSender | null = null;

export function hasQaDoc(qaId: string): boolean {
  return docs.has(qaId);
}

export function getQaDoc(qaId: string): Y.Doc {
  const existing = docs.get(qaId);
  if (existing) return existing;

  const doc = new Y.Doc();
  doc.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN) return;
    currentSender?.(qaId, update);
  });
  docs.set(qaId, doc);
  return doc;
}

// 한 번에 하나의 문서 소켓만 송신자로 바인딩된다. 반환된 해제 함수는 자신이 바인딩한 송신자일 때만 해제한다.
export function bindQaSender(sender: QaSender): () => void {
  currentSender = sender;
  return () => {
    if (currentSender === sender) currentSender = null;
  };
}

export function applyRemoteQaUpdate(qaId: string, base64Update: string): void {
  if (closedQaIds.has(qaId)) return;
  Y.applyUpdate(getQaDoc(qaId), base64ToUint8Array(base64Update), REMOTE_ORIGIN);
}

// 재연결 시 오프라인 중 입력을 전파하기 위한 전체 상태 (Yjs가 중복 적용을 멱등 처리한다)
export function encodeQaState(qaId: string): Uint8Array | null {
  const doc = docs.get(qaId);
  return doc ? Y.encodeStateAsUpdate(doc) : null;
}

export function destroyQaDoc(qaId: string): void {
  closedQaIds.add(qaId);
  const doc = docs.get(qaId);
  if (!doc) return;
  docs.delete(qaId);
  doc.destroy();
}
