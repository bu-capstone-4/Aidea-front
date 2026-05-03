import type { DocumentType } from '../types';

export interface TeamspaceCreateRequest {
  name: string;
  idea: string;
  documents: DocumentType[];
}

export interface InviteRequest {
  emails: string[];
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface DocumentCreateRequest {
  teamspaceId: string;
  type: DocumentType;
  title?: string;
}

export interface DocumentUpdateRequest {
  title: string;
}

export interface FeedbackRequest {
  additionalRequest?: string;
}
