import type { DocumentType, FeedbackStatus } from '@/types/document';

export type DocumentAiStatus = 'IDLE' | 'DRAFT' | 'FEEDBACK_IN_PROGRESS';

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  profileImageUrl: string | null;
  provider: 'LOCAL' | 'GOOGLE' | 'KAKAO';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface MemberInfo {
  userId: number;
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
  profileImageUrl: string | null;
}

export interface PendingInvitation {
  invitationId: string;
  email: string;
}

export interface InviteResponse {
  invitationId: string;
  email: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
}

export interface DocumentSummary {
  id: string;
  type: DocumentType;
  title: string;
  updatedAt: string;
  updatedBy: string | null;
  aiStatus: DocumentAiStatus;
}

export interface DocumentDetail extends DocumentSummary {
  teamspaceId: string;
  createdAt: string;
  yjsBinary: string;
}

export interface TeamspaceSummary {
  teamspaceId: string;
  name: string;
  createdAt: string;
}

export interface TeamspaceDetail {
  teamspaceId: string;
  name: string;
  documents: DocumentSummary[];
  createdAt: string;
}

export interface FeedbackResponse {
  feedbackId: string;
  status: FeedbackStatus;
}
