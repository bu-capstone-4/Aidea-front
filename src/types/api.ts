import type { DocumentType, FeedbackStatus } from '@/types/document';

export type TeamspaceStatus = 'CREATING' | 'CREATED';

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
  userId: number | null;
  name: string | null;
  email: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'PENDING';
  profileImageUrl: string | null;
}

export interface DocumentSummary {
  id: string;
  type: DocumentType;
  title: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface DocumentDetail extends DocumentSummary {
  teamspaceId: string;
  yjsBinary: string;
}

export interface TeamspaceSummary {
  teamspaceId: string;
  name: string;
  memberCount: number;
  status: TeamspaceStatus;
  createdAt: string;
}

export interface TeamspaceDetail {
  teamspaceId: string;
  name: string;
  status: TeamspaceStatus;
  documents: DocumentSummary[];
  members: MemberInfo[];
  createdAt: string;
}

export interface FeedbackResponse {
  feedbackId: string;
  status: FeedbackStatus;
}

export interface Invitation {
  invitationId: string;
  teamspaceId: string;
  email: string;
  token: string;
  status: 'PENDING';
}
