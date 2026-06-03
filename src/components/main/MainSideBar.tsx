import TeamSpaceDropDown from './TeamSpaceDropDown';
import { useNavigate, useParams } from 'react-router';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdLightbulb,
  MdDescription,
  MdPerson,
  MdCode,
  MdTableChart,
  MdAdd,
} from 'react-icons/md';
import UserAvatar from '../ui/UserAvatar';
import Button from '../ui/Button';
import { cn } from '@/shared/cn';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import { useTeamspaceDetail } from '@/hooks/useTeamspaceDetail';
import type { DocumentType } from '@/types/document';
import type { ElementType } from 'react';
import { getDocLabel } from '@/components/CreateTeamSpace/types';
import { useState } from 'react';
import { apiClient } from '@/shared/apiClient';
import CreateDocumentModal from './CreateDocumentModal';

const DOC_ICON: Record<DocumentType, ElementType> = {
  IDEA: MdLightbulb,
  PLAN: MdDescription,
  USER_SCENARIO: MdPerson,
  API_SPEC: MdCode,
  ERD: MdTableChart,
};

interface SideBarProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
}

export default function MainSideBar({ isSideBarOpen, toggleSideBar }: SideBarProps) {
  const navigate = useNavigate();
  const { docId } = useParams();
  const { user } = useCurrentUser();
  const { currentTeamspaceId, documentAiStatuses } = useTeamspaceStore();
  const { teamspace, refetch } = useTeamspaceDetail(currentTeamspaceId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateDocument = async (type: string) => {
    if (!currentTeamspaceId) return;
    await apiClient.post('/api/documents', { teamspaceId: currentTeamspaceId, type });
    refetch();
  };

  return (
    <aside
      className={cn(
        'bg-sidebar flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden',
        isSideBarOpen ? 'w-60' : 'w-14'
      )}
    >
      {/* 상단 헤더: 펼쳤을 때는 팀스페이스 + 닫기, 접혔을 때는 펼치기 아이콘만 */}
      <div
        className={cn(
          'flex items-center p-4 gap-2',
          isSideBarOpen ? 'justify-between' : 'justify-center'
        )}
      >
        {isSideBarOpen && (
          <div className="flex-1 min-w-0">
            <TeamSpaceDropDown />
          </div>
        )}
        <button
          onClick={toggleSideBar}
          className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer shrink-0"
        >
          {isSideBarOpen ? (
            <MdKeyboardDoubleArrowLeft size={20} />
          ) : (
            <MdKeyboardDoubleArrowRight size={20} />
          )}
        </button>
      </div>

      {/* 문서 목록 */}
      <div className={cn('flex flex-col p-2 space-y-1', !isSideBarOpen && 'items-center')}>
        {teamspace?.documents.map((doc) => {
          const Icon = DOC_ICON[doc.type] ?? MdDescription;
          const isDrafting = documentAiStatuses[doc.id] === 'DRAFT';

          return (
            <Button
              key={doc.id}
              variant="ghost"
              size={isSideBarOpen ? 'sm' : 'icon'}
              icon={<Icon size={18} className="shrink-0" />}
              className={cn(
                isSideBarOpen && 'w-full justify-start',
                docId === doc.id && 'bg-primary-light text-primary-dark'
              )}
              onClick={() => navigate(`/main/${doc.id}`)}
            >
              <span className="font-semibold">{getDocLabel(doc.type)}</span>
              {isSideBarOpen && (
                <span className="ml-auto flex items-center gap-1">
                  {isDrafting && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      AI 초안 생성 중
                    </span>
                  )}
                </span>
              )}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size={isSideBarOpen ? 'sm' : 'icon'}
          icon={<MdAdd size={18} className="shrink-0" />}
          className={cn('text-gray-500', isSideBarOpen && 'w-full justify-start')}
          onClick={() => setIsModalOpen(true)}
        >
          추가하기
        </Button>
      </div>

      <CreateDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleCreateDocument}
      />

      {/* 하단으로 밀기 */}
      <div className="mt-auto" />

      {/* 사이드바 하단 유저 프로필 */}
      <div className={cn('pb-1 flex', !isSideBarOpen && 'justify-center')}>
        <div className="p-4 text-lg flex items-center gap-3">
          <UserAvatar name={user?.name ?? ''} imageUrl={user?.profileImageUrl} />
          {isSideBarOpen && <div className="font-medium text-gray-800">{user?.name ?? ''}</div>}
        </div>
      </div>
    </aside>
  );
}
