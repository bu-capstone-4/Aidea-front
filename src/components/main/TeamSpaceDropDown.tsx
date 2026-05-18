import { useState } from 'react';
import { useNavigate } from 'react-router';
import MemberModal from './MemberModal';
import TeamSpaceAvatar from '@/components/ui/TeamSpaceAvatar';
import Button from '@/components/ui/Button';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useAuth } from '@/shared/useAuth';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceDetail } from '@/types/api';

export default function TeamSpaceDropDown() {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { currentTeamspaceId, setCurrentTeamspaceId } = useTeamspaceStore();
  const { teamspaces } = useTeamspaces();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);

  const handleCreateTeamspace = () => {
    setIsDropDownOpen(false);
    navigate('/create');
  };

  const handleSwitchTeamspace = async (tsId: string) => {
    setCurrentTeamspaceId(tsId);
    const res = await apiClient.get(`/api/teamspaces/${tsId}`);
    const ts: TeamspaceDetail = res.data.data;
    if (ts.documents?.length) {
      navigate(`/main/${ts.documents[0].id}`);
    }
    setIsDropDownOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => setIsDropDownOpen((p) => !p)}
      >
        <TeamSpaceAvatar name={teamspace?.name ?? '...'} size="sm" />
        <div className="text-xl font-bold group-hover:text-gray-600 transition-colors truncate">
          {teamspace?.name ?? '...'}
        </div>
      </button>

      {/* 드롭다운 */}
      {isDropDownOpen && (
        <div className="absolute top-full -left-4 w-60 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col p-2 z-50">
          {/* 현재 팀 스페이스 */}
          <div className="p-2 border-b border-gray-100 mb-1">
            <div className="text-xl font-bold truncate">{teamspace?.name}</div>
            <div className="text-xs text-gray-500 mb-2">
              멤버 {teamspace?.members?.length ?? 0}명
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start pl-2"
              onClick={() => {
                setIsMemberModalOpen(true);
                setIsDropDownOpen(false);
              }}
            >
              멤버관리
            </Button>
          </div>

          {/* 팀 스페이스 목록 */}
          <div className="flex flex-col py-1">
            <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
              팀 스페이스
            </div>
            <div className="flex flex-col gap-0.5">
              {teamspaces.map((ts) => {
                const isCurrent = ts.teamspaceId === currentTeamspaceId;
                return (
                  <Button
                    key={ts.teamspaceId}
                    size="sm"
                    className={
                      isCurrent
                        ? 'w-full justify-start bg-primary-light text-primary-dark hover:bg-primary-light/80 pl-2'
                        : 'w-full justify-start pl-2'
                    }
                    variant={isCurrent ? 'primary' : 'ghost'}
                    onClick={() => handleSwitchTeamspace(ts.teamspaceId)}
                  >
                    <TeamSpaceAvatar
                      name={ts.name}
                      size="sm"
                      className="size-5 text-xs rounded-lg"
                    />
                    {ts.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start pl-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={handleCreateTeamspace}
            >
              + 팀스페이스 생성
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-500 pl-2"
              onClick={logout}
            >
              로그아웃
            </Button>
          </div>
        </div>
      )}

      <MemberModal
        isMemberModalOpen={isMemberModalOpen}
        toggleMemberModal={() => setIsMemberModalOpen(false)}
      />
    </div>
  );
}
