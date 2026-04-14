import React, { useState } from 'react';

export default function TeamSpaceDropDown() {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

  const toggleDropDown = () => {
    setIsDropDownOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button className="flex items-center gap-2 group cursor-pointer" onClick={toggleDropDown}>
        <div>아이콘</div>
        <div className="text-xl font-bold group-hover:text-gray-600 transition-colors">
          팀 스페이스 이름
        </div>
      </button>

      {/* 드롭다운 */}
      {isDropDownOpen && (
        <div className="absolute top-full -left-4 w-60 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col p-2 z-50">
          {/* 현재 팀 스페이스 */}
          <div className="p-2 border-b border-gray-100 mb-1">
            <div className="font-bold text-gray-800">팀 스페이스 이름</div>
            <div className="text-xs text-gray-500 mb-2">멤버 2명</div>
            <button className="w-full text-left text-sm text-gray-600 font-medium">멤버관리</button>
          </div>

          {/* 팀 스페이스 목록 */}
          <div className="flex flex-col py-1">
            <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
              팀 스페이스
            </div>
            <div className="flex flex-col gap-0.5 ">
              <button className="w-full text-left p-2 hover:bg-gray-100 rounded-lg text-sm transition-colors cursor-pointer">
                현재 팀 스페이스
              </button>
              <button className="w-full text-left p-2 hover:bg-gray-100 rounded-lg text-sm transition-colors cursor-pointer">
                이전 팀 스페이스
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button className="w-full text-left p-2 hover:bg-red-50 rounded-lg text-red-500 text-sm font-medium transition-colors cursor-pointer">
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
