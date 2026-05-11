import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiClient } from '@/shared/apiClient';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import MainSideBar from '@/components/main/MainSideBar';
import MainHeaderBar from '@/components/main/MainHeaderBar';
import MainContent from '@/components/main/MainContent';
import type { TeamspaceSummary, TeamspaceDetail } from '@/mocks/types';

export default function MainPage() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const { docId } = useParams();
  const navigate = useNavigate();
  const { setCurrentTeamspaceId } = useTeamspaceStore();

  useEffect(() => {
    if (docId) {
      // 현재 문서로부터 teamspaceId 동기화
      apiClient.get(`/api/documents/${docId}`).then((res) => {
        setCurrentTeamspaceId(res.data.data.teamspaceId);
      });
    } else {
      // docId 없으면 첫 번째 팀스페이스의 첫 문서로 이동
      apiClient.get('/api/teamspaces').then(async (res) => {
        const list: TeamspaceSummary[] = res.data.data.teamspaces;
        if (!list.length) return;
        const first = list[0];
        setCurrentTeamspaceId(first.teamspaceId);
        const detail = await apiClient.get(`/api/teamspaces/${first.teamspaceId}`);
        const ts: TeamspaceDetail = detail.data.data;
        if (ts.documents.length) {
          navigate(`/main/${ts.documents[0].id}`, { replace: true });
        }
      });
    }
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
