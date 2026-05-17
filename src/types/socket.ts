import type { DocumentType } from '@/types/document';

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

export interface DocInitEvent {
  type: 'doc:init';
  updates: string[];
}

export interface DocUpdateEvent {
  type: 'doc:update';
  update: string;
}

export interface FeedbackStartEvent {
  event: 'feedback:start';
  data: { feedbackId: string; requestedBy: number };
}

export interface FeedbackErrorEvent {
  event: 'feedback:error';
  data: { feedbackId: string; code: FeedbackErrorCode | string; message: string };
}

export interface FeedbackReadyEvent {
  event: 'feedback:ready';
  data: { feedbackId: string; yjsBinary: string; status: 'DONE' };
}

export interface FeedbackVersionAppliedEvent {
  event: 'feedback:version-applied';
  data: {
    feedbackId: string;
    selectedVersion: 'ORIGINAL' | 'AI';
    yjsBinary: string;
    appliedBy: number;
  };
}

export interface DocumentSocketErrorEvent {
  event: 'error';
  code: DocumentSocketErrorCode | string;
  message: string;
}

export type DocumentServerMessage =
  | DocInitEvent
  | DocUpdateEvent
  | FeedbackStartEvent
  | FeedbackErrorEvent
  | FeedbackReadyEvent
  | FeedbackVersionAppliedEvent
  | DocumentSocketErrorEvent;

// ─── 문서 소켓 client → server ────────────────────────────────────────────────

export interface DocUpdateRequest {
  type: 'doc:update';
  update: string;
  clientId?: string;
}

export type DocumentClientMessage = DocUpdateRequest;

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
    teamspace: { id: string; name: string; status: 'CREATING' | 'CREATED' };
    onlineMembers: ActiveMember[];
  };
}

export interface TeamspaceReadyEvent {
  event: 'teamspace:ready';
  data: {
    status: 'CREATED';
    documents: {
      id: string;
      type: DocumentType;
      title: string;
      yjsBinary: string | null;
      updatedAt: string;
    }[];
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
  | TeamspaceReadyEvent
  | MemberUpdateEvent
  | TeamspaceSocketErrorEvent;

// ─── 팀스페이스 소켓 client → server ─────────────────────────────────────────

export interface MemberFocusRequest {
  event: 'member:focus';
  data: { documentId: string | null };
}

export type TeamspaceClientMessage = MemberFocusRequest;
