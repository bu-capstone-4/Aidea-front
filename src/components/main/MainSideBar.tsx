import TeamSpaceDropDown from './TeamSpaceDropDown';
import { useNavigate, useParams } from 'react-router';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdLightbulb,
  MdDescription,
  MdAdd,
} from 'react-icons/md';
import UserAvatar from '../ui/UserAvatar';
import Button from '../ui/Button';
import { cn } from '@/shared/cn';

interface SideBarProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
}

export default function MainSideBar({ isSideBarOpen, toggleSideBar }: SideBarProps) {
  const navigate = useNavigate();
  const { docId } = useParams();

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
        <Button
          variant="ghost"
          size={isSideBarOpen ? 'sm' : 'icon'}
          icon={<MdLightbulb size={18} className="shrink-0" />}
          className={cn(
            isSideBarOpen && 'w-full justify-start',
            docId === 'idea' && 'bg-primary-light text-primary-dark'
          )}
          onClick={() => navigate('/main/idea')}
        >
          <span className="font-semibold">아이디어</span>
        </Button>

        <Button
          variant="ghost"
          size={isSideBarOpen ? 'sm' : 'icon'}
          icon={<MdDescription size={18} className="shrink-0" />}
          className={cn(
            isSideBarOpen && 'w-full justify-start',
            docId === 'plan' && 'bg-primary-light text-primary-dark'
          )}
          onClick={() => navigate('/main/plan')}
        >
          <span className="font-semibold">기획서</span>
        </Button>

        <Button
          variant="ghost"
          size={isSideBarOpen ? 'sm' : 'icon'}
          icon={<MdAdd size={18} className="shrink-0" />}
          className={cn('text-gray-500', isSideBarOpen && 'w-full justify-start')}
        >
          추가하기
        </Button>
      </div>

      {/* 하단으로 밀기 */}
      <div className="mt-auto" />

      {/* 사이드바 하단 유저 프로필 */}
      <div className={cn('pb-1 flex', !isSideBarOpen && 'justify-center')}>
        <div className="p-4 text-lg flex items-center gap-3">
          <UserAvatar name="유저 이름" />
          {isSideBarOpen && <div className="font-medium text-gray-800">유저 이름</div>}
        </div>
      </div>
    </aside>
  );
}
