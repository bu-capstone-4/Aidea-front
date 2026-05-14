import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiClient } from '@/shared/apiClient';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import MainSideBar from '@/components/main/MainSideBar';
import MainHeaderBar from '@/components/main/MainHeaderBar';
import MainContent from '@/components/main/MainContent';
import { useTeamspaceSocket } from '@/hooks/useTeamspaceSocket';
import type { TeamspaceSummary, TeamspaceDetail } from '@/mocks/types';

export default function MainPage() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const { docId } = useParams();
  const navigate = useNavigate();
  const { currentTeamspaceId, setCurrentTeamspaceId } = useTeamspaceStore();

  useTeamspaceSocket({
    teamspaceId: currentTeamspaceId,
    documentId: docId ?? null,
    mock: true,
  });

  useEffect(() => {
    if (docId) {
      apiClient.get(`/api/documents/${docId}`).then((res) => {
        setCurrentTeamspaceId(res.data.data.teamspaceId);
      });
      return;
    }

    apiClient.get('/api/teamspaces').then(async (res) => {
      const data = res.data.data;
      const list: TeamspaceSummary[] = Array.isArray(data) ? data : (data?.teamspaces ?? []);

      if (!list.length) {
        navigate('/create', { replace: true });
        return;
      }

      const first = list[0];
      setCurrentTeamspaceId(first.teamspaceId);

      const detail = await apiClient.get(`/api/teamspaces/${first.teamspaceId}`);
      const ts: TeamspaceDetail = detail.data.data;

      if (ts.documents.length) {
        navigate(`/main/${ts.documents[0].id}`, { replace: true });
      }
    });
  }, [docId, navigate, setCurrentTeamspaceId]);

  return (
    <div className="h-screen flex">
      <MainSideBar
        isSideBarOpen={isSideBarOpen}
        toggleSideBar={() => setIsSideBarOpen((p) => !p)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeaderBar />
        <MainContent />
      </div>
    </div>
  );
}
