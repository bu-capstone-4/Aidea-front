import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceSummary } from '@/types/api';

export function useTeamspaces() {
  const [teamspaces, setTeamspaces] = useState<TeamspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeamspaces = useCallback(() => {
    setIsLoading(true);
    apiClient
      .get('/api/teamspaces')
      .then((res) => {
        const data = res.data.data;
        const list: TeamspaceSummary[] = Array.isArray(data) ? data : (data?.teamspaces ?? []);
        setTeamspaces(list);
      })
      .catch(() => setTeamspaces([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeamspaces();
  }, [fetchTeamspaces]);

  return { teamspaces, isLoading, refetch: fetchTeamspaces };
}
