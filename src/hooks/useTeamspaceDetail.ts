import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceDetail } from '@/types/api';
import { useTeamspaceStore } from '@/store/teamspaceStore';

export function useTeamspaceDetail(teamspaceId: string | null) {
  const [teamspace, setTeamspace] = useState<TeamspaceDetail | null>(null);
  const setDocumentAiStatus = useTeamspaceStore((state) => state.setDocumentAiStatus);

  const refetch = useCallback(() => {
    if (!teamspaceId) return;
    apiClient
      .get(`/api/teamspaces/${teamspaceId}`)
      .then((res) => {
        const data: TeamspaceDetail = res.data.data;
        setTeamspace(data);
        data.documents.forEach((doc) => {
          setDocumentAiStatus(doc.id, doc.aiStatus);
        });
      })
      .catch(() => setTeamspace(null));
  }, [teamspaceId, setDocumentAiStatus]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { teamspace, refetch };
}
