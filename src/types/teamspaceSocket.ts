import type { DocumentType, Question, TeamRole } from '@/types/document';

export type MemberRole = TeamRole;

export interface ActiveMember {
  userId: number;
  name: string;
  profileImageUrl: string | null;
  role: MemberRole;
  currentDocumentId: string | null;
}

export interface TeamspaceSocketMeta {
  id: string;
  name: string;
}

export interface DocumentReady {
  id: string;
  type: DocumentType;
  title: string;
  yjsBinary: string | null;
  updatedAt: string;
}

export interface TeamspaceInitEvent {
  event: 'teamspace:init';
  data: {
    teamspace: TeamspaceSocketMeta;
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
  data: {
    onlineMembers: ActiveMember[];
  };
}

export type TeamspaceServerMessage =
  | TeamspaceInitEvent
  | DraftQuestioningEvent
  | DraftReadyEvent
  | DraftErrorEvent
  | MemberUpdateEvent;

export interface MemberFocusRequest {
  event: 'member:focus';
  data: {
    documentId: string | null;
  };
}

export type TeamspaceClientMessage = MemberFocusRequest;
