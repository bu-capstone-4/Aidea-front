import type { TeamRole } from '@/types/document';

export const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: '소유자',
  MEMBER: '멤버',
  VIEWER: '뷰어',
};
