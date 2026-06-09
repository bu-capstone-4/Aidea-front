import type { FeedbackStatus, Question } from '@/types/document';

// ─── 공통 ─────────────────────────────────────────────────────────────────────

export type MemberRole = 'OWNER' | 'MEMBER' | 'VIEWER';

export interface ActiveMember {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: MemberRole;
  currentDocumentId: string | null;
}

// ─── 문서 소켓 에러 코드 ───────────────────────────────────────────────────────

export type DocumentSocketErrorCode =
  | 'DOCUMENT_LOCKED'
  | 'INSUFFICIENT_PERMISSION'
  | 'DOCUMENT_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_MESSAGE';

export type FeedbackErrorCode =
  | 'AI_FEEDBACK_FAILED'
  | 'AI_TIMEOUT'
  | 'CONTENT_EMPTY'
  | 'DOCUMENT_NOT_FOUND';

// ─── 문서 소켓 server → client ────────────────────────────────────────────────

export interface ActiveFeedbackInfo {
  feedbackId: string;
  status: FeedbackStatus;
  revisedMarkdown?: string | null;
  questions?: Question[] | null;
}

export interface ActiveDraftInfo {
  draftId: string;
  status: 'PENDING' | 'QUESTIONING' | 'ANSWERING' | 'DONE' | 'FAILED';
  content?: string | null;
  questions?: Question[] | null;
}

export interface DocInitEvent {
  type: 'doc:init';
  updates: string[];
  activeFeedback?: ActiveFeedbackInfo | null;
  activeDraft?: ActiveDraftInfo | null;
}

export interface DocUpdateEvent {
  type: 'doc:update';
  update: string;
}

export interface DocAwarenessEvent {
  type: 'doc:awareness';
  update: string; // base64
}

export interface DocAwarenessInitEvent {
  type: 'doc:awareness:init';
  states: string[]; // base64[]
}

export interface DocAwarenessRemoveEvent {
  type: 'doc:awareness:remove';
  yjsClientId: number;
}

export interface FeedbackStartedEvent {
  type: 'feedback:started';
  feedbackId: string;
  requestedBy: { userId: number; name: string };
}

export interface FeedbackQuestioningEvent {
  type: 'feedback:questioning';
  feedbackId: string;
  questions: Question[];
}

export interface FeedbackReadyEvent {
  type: 'feedback:ready';
  feedbackId: string;
  revisedMarkdown: string;
}

export interface FeedbackErrorEvent {
  type: 'feedback:error';
  feedbackId: string;
}

export interface FeedbackResolvedEvent {
  type: 'feedback:resolved';
  feedbackId: string;
  outcome: 'ACCEPTED' | 'REJECTED';
}

export interface DocumentSocketErrorEvent {
  event: 'error';
  code: DocumentSocketErrorCode | string;
  message: string;
}

export type DocumentServerMessage =
  | DocInitEvent
  | DocUpdateEvent
  | DocAwarenessEvent
  | DocAwarenessInitEvent
  | DocAwarenessRemoveEvent
  | FeedbackStartedEvent
  | FeedbackQuestioningEvent
  | FeedbackReadyEvent
  | FeedbackErrorEvent
  | FeedbackResolvedEvent
  | DocumentSocketErrorEvent;

// ─── 문서 소켓 client → server ────────────────────────────────────────────────

export interface DocUpdateRequest {
  type: 'doc:update';
  update: string;
  clientId?: string;
}

export interface DocAwarenessRequest {
  type: 'doc:awareness';
  yjsClientId: number;
  update: string; // base64
}

export type DocumentClientMessage = DocUpdateRequest | DocAwarenessRequest;

// ─── 팀스페이스 소켓 에러 코드 ───────────────────────────────────────────────

export type TeamspaceSocketErrorCode =
  | 'INSUFFICIENT_PERMISSION'
  | 'UNAUTHORIZED'
  | 'SESSION_EXPIRED'
  | 'INTERNAL_SERVER_ERROR';

// ─── 팀스페이스 소켓 server → client ─────────────────────────────────────────

export interface TeamspaceInitEvent {
  event: 'teamspace:init';
  data: {
    teamspace: { id: string; name: string };
    onlineMembers: ActiveMember[];
  };
}

export interface DraftQuestioningEvent {
  event: 'draft:questioning';
  data: {
    documentId: string;
    draftId: string;
    questions: Question[];
  };
}

export interface DraftReadyEvent {
  event: 'draft:ready';
  data: {
    documentId: string;
    draftId: string;
    content: string;
  };
}

export interface DraftErrorEvent {
  event: 'draft:error';
  data: {
    documentId: string;
  };
}

export interface MemberUpdateEvent {
  event: 'member:update';
  data: { onlineMembers: ActiveMember[] };
}

export interface TeamspaceSocketErrorEvent {
  event: 'error';
  code: TeamspaceSocketErrorCode | string;
  message: string;
}

export type TeamspaceServerMessage =
  | TeamspaceInitEvent
  | DraftQuestioningEvent
  | DraftReadyEvent
  | DraftErrorEvent
  | MemberUpdateEvent
  | TeamspaceSocketErrorEvent;

// ─── 팀스페이스 소켓 client → server ─────────────────────────────────────────

export interface MemberFocusRequest {
  event: 'member:focus';
  data: { documentId: string | null };
}

export type TeamspaceClientMessage = MemberFocusRequest;
