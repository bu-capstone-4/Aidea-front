import type {
  UserResponse,
  MemberInfo,
  DocumentDetail,
  TeamspaceDetail,
  FeedbackResponse,
  Invitation,
} from './types';

// ── 현재 로그인 유저 ──────────────────────────────────────────
export const currentUser: UserResponse = {
  id: 1,
  email: 'owner@aidea.com',
  name: '김민석',
  profileImageUrl: null,
  provider: 'GOOGLE',
};

// ── 세션 (쿠키 미지원 환경 대응용 in-memory 인증 플래그) ────────
export const session = { isLoggedIn: false };

// ── 토큰 ─────────────────────────────────────────────────────
export const tokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 1800000,
};

// ── 문서 ─────────────────────────────────────────────────────
export const documents: DocumentDetail[] = [
  {
    id: 'doc_001',
    teamspaceId: 'ts_abc123',
    type: 'IDEA',
    title: '아이디어',
    yjsBinary: '',
    updatedAt: '2026-04-24T10:00:00',
    updatedBy: '김민석',
  },
  {
    id: 'doc_002',
    teamspaceId: 'ts_abc123',
    type: 'PLAN',
    title: '기획서',
    yjsBinary: '',
    updatedAt: '2026-04-24T10:10:00',
    updatedBy: '김민석',
  },
  {
    id: 'doc_003',
    teamspaceId: 'ts_abc123',
    type: 'USER_SCENARIO',
    title: '유저 시나리오',
    yjsBinary: '',
    updatedAt: '2026-04-24T10:20:00',
    updatedBy: null,
  },
  {
    id: 'doc_004',
    teamspaceId: 'ts_abc123',
    type: 'API_SPEC',
    title: 'API 명세서',
    yjsBinary: '',
    updatedAt: '2026-04-24T10:30:00',
    updatedBy: null,
  },
];

// ── 멤버 ─────────────────────────────────────────────────────
export const members: MemberInfo[] = [
  {
    userId: 1,
    name: '김민석',
    email: 'owner@aidea.com',
    role: 'OWNER',
    status: 'ACTIVE',
    profileImageUrl: null,
  },
  {
    userId: 2,
    name: '이지은',
    email: 'member1@aidea.com',
    role: 'MEMBER',
    status: 'ACTIVE',
    profileImageUrl: null,
  },
  {
    userId: null,
    name: null,
    email: 'pending@aidea.com',
    role: 'MEMBER',
    status: 'PENDING',
    profileImageUrl: null,
  },
];

// ── 팀스페이스 ────────────────────────────────────────────────
export const teamspaces: TeamspaceDetail[] = [
  {
    teamspaceId: 'ts_abc123',
    name: 'Aidea 프로젝트',
    status: 'CREATED',
    documents: documents.map(({ id, type, title, updatedAt, updatedBy }) => ({
      id,
      type,
      title,
      updatedAt,
      updatedBy,
    })),
    members,
    createdAt: '2026-04-24T09:00:00',
  },
];

// ── 초대 ─────────────────────────────────────────────────────
export const invitations: Invitation[] = [];

// ── 피드백 ───────────────────────────────────────────────────
export const feedbacks: (FeedbackResponse & { documentId: string })[] = [];

// ── ID 카운터 ─────────────────────────────────────────────────
let docCounter = documents.length + 1;
let feedbackCounter = 1;
let invitationCounter = 1;

export const nextDocId = () => `doc_00${++docCounter}`;
export const nextFeedbackId = () => `fb_00${feedbackCounter++}`;
export const nextInvitationId = () => `inv_00${invitationCounter++}`;
export const nextInviteToken = () => `token_${Math.random().toString(36).slice(2)}`;
