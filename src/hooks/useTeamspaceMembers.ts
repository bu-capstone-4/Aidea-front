import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { MemberInfo } from '@/types/api';

export function useTeamspaceMembers(teamspaceId: string | null) {
  const [members, setMembers] = useState<MemberInfo[]>([]);

  useEffect(() => {
    if (!teamspaceId) return;
    apiClient
      .get(`/api/teamspaces/${teamspaceId}/members`)
      .then((res) => setMembers(res.data.data ?? []))
      .catch(() => setMembers([]));
  }, [teamspaceId]);

  return members;
}
