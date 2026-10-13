import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiClient } from '@/shared/apiClient';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import MainSideBar from '@/components/main/MainSideBar';
import MainHeaderBar from '@/components/main/MainHeaderBar';
import MainContent from '@/components/main/MainContent';
import BacklogModal from '@/components/backlog/BacklogModal';
import { useTeamspaceSocket } from '@/hooks/useTeamspaceSocket';
import { isMobileViewport, useIsMobile } from '@/hooks/useIsMobile';
import type { TeamspaceSummary, TeamspaceDetail } from '@/types/api';

export default function MainPage() {
  // 모바일은 사이드바가 본문을 덮는 오버레이라 접힌 상태로 시작한다
  const [isSideBarOpen, setIsSideBarOpen] = useState(() => !isMobileViewport());
  const [isBacklogOpen, setIsBacklogOpen] = useState(false);
  const { docId } = useParams();
  const isMobile = useIsMobile();
  const [prevDocId, setPrevDocId] = useState(docId);

  // 모바일에서 문서를 고르면 오버레이 사이드바를 닫는다
  if (prevDocId !== docId) {
    setPrevDocId(docId);
    if (isMobile) setIsSideBarOpen(false);
  }
  const navigate = useNavigate();
  const { currentTeamspaceId, setCurrentTeamspaceId } = useTeamspaceStore();

  useTeamspaceSocket({
    teamspaceId: currentTeamspaceId,
    documentId: docId ?? null,
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
    <div className="h-dvh flex">
      <MainSideBar
        isSideBarOpen={isSideBarOpen}
        toggleSideBar={() => setIsSideBarOpen((p) => !p)}
      />
      {/* 모바일: 사이드바가 fixed로 빠지므로 접힌 레일 폭만큼 흐름 안에 자리를 남긴다 */}
      <div className="w-14 shrink-0 md:hidden" />
      {isSideBarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSideBarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeaderBar onBacklogClick={() => setIsBacklogOpen(true)} />
        <MainContent />
      </div>

      {isBacklogOpen && currentTeamspaceId && (
        <BacklogModal teamspaceId={currentTeamspaceId} onClose={() => setIsBacklogOpen(false)} />
      )}
    </div>
  );
}
