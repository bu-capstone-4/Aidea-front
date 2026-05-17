import type { DocumentType, TeamRole } from '@/types/document';

export type TeamspaceStatus = 'CREATING' | 'CREATED';
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
  status: TeamspaceStatus;
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

export interface TeamspaceReadyEvent {
  event: 'teamspace:ready';
  data: {
    status: 'CREATED';
    documents: DocumentReady[];
  };
}

export interface MemberUpdateEvent {
  event: 'member:update';
  data: {
    onlineMembers: ActiveMember[];
  };
}

export type TeamspaceServerMessage = TeamspaceInitEvent | TeamspaceReadyEvent | MemberUpdateEvent;

export interface MemberFocusRequest {
  event: 'member:focus';
  data: {
    documentId: string | null;
  };
}

export type TeamspaceClientMessage = MemberFocusRequest;
