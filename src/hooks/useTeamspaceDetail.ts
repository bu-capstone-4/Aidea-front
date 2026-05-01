import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceDetail } from '@/mocks/types';

export function useTeamspaceDetail(teamspaceId: string | null) {
  const [teamspace, setTeamspace] = useState<TeamspaceDetail | null>(null);

  const refetch = useCallback(() => {
    if (!teamspaceId) return;
    apiClient
      .get(`/api/teamspaces/${teamspaceId}`)
      .then((res) => setTeamspace(res.data.data))
      .catch(() => setTeamspace(null));
  }, [teamspaceId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { teamspace, refetch };
}
