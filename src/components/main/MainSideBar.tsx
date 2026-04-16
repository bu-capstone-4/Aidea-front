import TeamSpaceDropDown from './TeamSpaceDropDown';
import { useNavigate, useParams } from 'react-router-dom';

interface SideBarProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
}

export default function MainSideBar({ isSideBarOpen, toggleSideBar }: SideBarProps) {
  const navigate = useNavigate();
  const { docId } = useParams();

  return (
    <aside
      className={`bg-sidebar flex flex-col h-screen transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${isSideBarOpen ? 'w-60' : 'w-0'}`}
    >
      {/* 팀스페이스명, 사이드바 닫기 */}
      <div className="flex justify-between items-center p-4 relative gap-2">
        <div className="flex-1">
          <TeamSpaceDropDown />
        </div>
        <button
          onClick={toggleSideBar}
          className="text-gray-500 hover:text-gray-800 transition-colors text-sm cursor-pointer"
        >
          닫기
        </button>
      </div>

      {/* 구분선 */}
      <hr className="bg-border h-px border-none" />

      {/* 문서 목록 */}
      <div className="flex flex-col p-2 space-y-1 ">
        <button
          className={
            docId === 'idea'
              ? 'bg-primary-light text-primary-dark font-semibold rounded-md h-8 px-2 flex items-center text-base'
              : 'cursor-pointer text-ink font-normal rounded-md h-8 px-2 flex items-center text-base hover:bg-surface'
          }
          onClick={() => {
            navigate('/main/idea');
          }}
        >
          <div>아이콘</div>
          <div className="font-semibold ">아이디어</div>
        </button>
        <button
          className={
            docId === 'plan'
              ? 'bg-primary-light text-primary-dark font-semibold rounded-md h-8 px-2 flex items-center text-base'
              : 'cursor-pointer text-ink font-normal rounded-md h-8 px-2 flex items-center text-base hover:bg-surface'
          }
          onClick={() => {
            navigate('/main/plan');
          }}
        >
          <div>아이콘</div>
          <div className="font-semibold ">기획서</div>
        </button>

        {/* 문서 추가 */}
        <button className="w-full text-left p-3 text-lg font-medium text-gray-500 hover:bg-gray-200 rounded-md transition-colors cursor-pointer">
          + 추가하기
        </button>
      </div>

      {/* 구분선 */}
      <hr className="mt-auto bg-border h-px border-none" />

      {/* 사이드바 하단 유저 프로필 */}
      <div className="pb-6">
        <div className="p-4 text-lg flex items-center gap-3">
          <div className="rounded-full bg-primary size-8 flex items-center justify-center text-white font-semibold text-sm">
            ㅇ
          </div>
          <div className="font-medium text-gray-800">유저 이름</div>
        </div>
      </div>
    </aside>
  );
}
