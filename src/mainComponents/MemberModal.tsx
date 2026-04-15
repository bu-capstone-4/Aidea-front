import React from 'react';

interface memberModalProps {
  isMemberModalOpen: boolean;
  toggleMemberModal: () => void;
}

export default function MemberModal({ isMemberModalOpen, toggleMemberModal }: memberModalProps) {
  if (isMemberModalOpen === false) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 flex flex-col gap-6 relative">
        <div className="flex justify-between text-2xl font-bold">
          <span>멤버 관리</span>
          <button
            className="cursor-pointer bg-surface text-ink font-medium rounded-md px-3 h-8 text-base"
            onClick={toggleMemberModal}
          >
            닫기
          </button>
        </div>
        <hr className="mt-auto bg-border h-px border-none" />

        <div className="text-xs text-gray-500 mb-2">멤버</div>
        <div className="flex gap-3">
          <div>아이콘</div>
          <div>이름</div>
        </div>
        <hr className="mt-auto bg-border h-px border-none" />

        {/* 우측 버튼은 상태로 저장해두면 될듯? */}
        <div className="flex justify-between w-full">
          <div className="flex gap-3 items-center">
            <div className="">아이콘</div>
            <div className="">이름</div>
          </div>
          {/* 방장 아닌 사람만 */}
          <button className="cursor-pointer bg-surface text-red-500 font-medium rounded-md px-3 h-8 text-base">
            추방
          </button>
        </div>
        <hr className="mt-auto bg-border h-px border-none" />

        <div className="flex justify-between w-full">
          <div className="flex gap-3 items-center">
            <div className="">아이콘</div>
            <div className="">이름</div>
          </div>
          {/* 초대 대기 중일 경우 */}
          <button className="cursor-pointer bg-surface text-ink font-medium rounded-md px-3 h-8 text-base">
            초대 취소
          </button>
        </div>
        <hr className="mt-auto bg-border h-px border-none" />

        <div>
          <div className="text-xs text-gray-500 mb-2">새 멤버 초대</div>
          <div>
            <input
              type="text"
              placeholder="name@company.com"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-400 transition-all"
            />
            <button className="cursor-pointer bg-primary text-white rounded-md px-3 py-1.5">
              초대 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
