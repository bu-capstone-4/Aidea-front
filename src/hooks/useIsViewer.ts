import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTeamspaceStore } from '@/store/teamspaceStore';

// 현재 사용자가 팀스페이스에서 VIEWER 역할인지 (온라인 멤버 프레즌스 기준)
export function useIsViewer(): boolean {
  const { user } = useCurrentUser();
  const onlineMembers = useTeamspaceStore((state) => state.onlineMembers);
  return onlineMembers.find((m) => m.userId === user?.id)?.role === 'VIEWER';
}
