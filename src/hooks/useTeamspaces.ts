import { useState, useEffect } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceSummary } from '@/mocks/types';

export function useTeamspaces() {
  const [teamspaces, setTeamspaces] = useState<TeamspaceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  return { teamspaces, isLoading };
}
