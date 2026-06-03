import { useState, useRef, useEffect } from 'react';
import { HiDotsHorizontal } from 'react-icons/hi';
import { useNavigate } from 'react-router';
import MemberModal from './MemberModal';
import TeamSpaceAvatar from '@/components/ui/TeamSpaceAvatar';
import Button from '@/components/ui/Button';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useTeamspaces } from '@/hooks/useTeamspaces';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import { useTeamspaceMembers } from '@/hooks/useTeamspaceMembers';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useAuth } from '@/shared/useAuth';
import { apiClient } from '@/shared/apiClient';
import type { TeamspaceDetail } from '@/types/api';

export default function TeamSpaceDropDown() {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [hoveredTsId, setHoveredTsId] = useState<string | null>(null);
  const [openMenuTsId, setOpenMenuTsId] = useState<string | null>(null);
  const [deleteTargetTsId, setDeleteTargetTsId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { currentTeamspaceId, setCurrentTeamspaceId } = useTeamspaceStore();
  const { teamspaces, refetch: refetchTeamspaces } = useTeamspaces();
  const { teamspace } = useTeamspaceDetail(currentTeamspaceId);
  const members = useTeamspaceMembers(currentTeamspaceId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuTsId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleDeleteTeamspace = async (tsId: string) => {
    await apiClient.delete(`/api/teamspaces/${tsId}`);
    setOpenMenuTsId(null);
    if (tsId === currentTeamspaceId) {
      setCurrentTeamspaceId(null);
      navigate('/');
    }
    refetchTeamspaces?.();
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
            <div className="text-xs text-gray-500 mb-2">멤버 {members.length}명</div>
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
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {teamspaces.map((ts) => {
                const isCurrent = ts.teamspaceId === currentTeamspaceId;
                const isHovered = hoveredTsId === ts.teamspaceId;
                const isMenuOpen = openMenuTsId === ts.teamspaceId;
                return (
                  <div
                    key={ts.teamspaceId}
                    className="relative flex items-center"
                    onMouseEnter={() => setHoveredTsId(ts.teamspaceId)}
                    onMouseLeave={() => setHoveredTsId(null)}
                  >
                    <Button
                      size="sm"
                      className={
                        isCurrent
                          ? 'w-full justify-start bg-primary-light text-primary-dark hover:bg-primary-light/80 pl-2 pr-7'
                          : 'w-full justify-start pl-2 pr-7'
                      }
                      variant={isCurrent ? 'primary' : 'ghost'}
                      onClick={() => handleSwitchTeamspace(ts.teamspaceId)}
                    >
                      <TeamSpaceAvatar
                        name={ts.name}
                        size="sm"
                        className="size-5 text-xs rounded-lg"
                      />
                      <span className="truncate">{ts.name}</span>
                    </Button>
                    {(isHovered || isMenuOpen) && (
                      <button
                        className="absolute right-1 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 text-gray-500 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuTsId(isMenuOpen ? null : ts.teamspaceId);
                        }}
                      >
                        <HiDotsHorizontal />
                      </button>
                    )}
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-0.5 w-28 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1"
                      >
                        <button
                          className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetTsId(ts.teamspaceId);
                            setOpenMenuTsId(null);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
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

      <ConfirmModal
        isOpen={deleteTargetTsId !== null}
        title="팀스페이스 삭제"
        message="정말로 이 팀스페이스를 삭제하시겠습니까?"
        confirmLabel="삭제"
        onConfirm={() => deleteTargetTsId && handleDeleteTeamspace(deleteTargetTsId)}
        onClose={() => setDeleteTargetTsId(null)}
      />
    </div>
  );
}
