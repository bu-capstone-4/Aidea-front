import { useState } from 'react';
import MemberModal from './MemberModal';
import TeamSpaceAvatar from '@/components/ui/TeamSpaceAvatar';
import Button from '@/components/ui/Button';

export default function TeamSpaceDropDown() {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const toggleDropDown = () => {
    setIsDropDownOpen((prev) => !prev);
  };

  const toggleMemberModal = () => {
    setIsMemberModalOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 group cursor-pointer"
        onClick={() => {
          toggleDropDown();
        }}
      >
        <TeamSpaceAvatar name="팀 스페이스 이름" size="sm" />
        <div className="text-xl font-bold group-hover:text-gray-600 transition-colors">
          팀 스페이스 이름
        </div>
      </button>

      {/* 드롭다운 */}
      {isDropDownOpen && (
        <div className="absolute top-full -left-4 w-60 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col p-2 z-50">
          {/* 현재 팀 스페이스 */}
          <div className="p-2 border-b border-gray-100 mb-1">
            <div className="text-xl font-bold group-hover:text-gray-600 transition-colors">
              팀 스페이스 이름
            </div>
            <div className="text-xs text-gray-500 mb-2">멤버 2명</div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start pl-2"
              onClick={() => {
                toggleMemberModal();
                toggleDropDown();
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
              <Button
                size="sm"
                className="w-full justify-start bg-primary-light text-primary-dark hover:bg-primary-light/80 pl-2"
              >
                <TeamSpaceAvatar
                  name="현재 팀 스페이스"
                  size="sm"
                  className="size-5 text-xs rounded-lg"
                />
                현재 팀 스페이스
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start pl-2">
                <TeamSpaceAvatar
                  name="이전 팀 스페이스"
                  size="sm"
                  className="size-5 text-xs rounded-lg"
                />
                이전 팀 스페이스
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-500 pl-2"
            >
              로그아웃
            </Button>
          </div>
        </div>
      )}
      <MemberModal isMemberModalOpen={isMemberModalOpen} toggleMemberModal={toggleMemberModal} />
    </div>
  );
}
