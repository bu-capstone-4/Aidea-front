import React from 'react';

interface SideBarProps {
  openSideBar: boolean;
  toggleSideBar: () => void;
}

export default function MainSideBar({ openSideBar, toggleSideBar }: SideBarProps) {
  return (
    <div
      className={`bg-gray-100 flex-col h-screen flex transition-all duration-300 ease-in-out  whitespace-nowrap overflow-hidden ${openSideBar ? 'w-64' : 'w-0'}`}
    >
      {/* 팀스페이스명, 사이드바 닫기 */}
      <div className="flex justify-between p-4">
        <div className="flex gap-2">
          <div>아이콘</div>
          <div className="text-xl font-bold">팀 스페이스 이름</div>
        </div>
        <button
          onClick={toggleSideBar}
          className="cursor-pointer hover:opacity-70 transition-opacity"
        >
          닫기
        </button>
      </div>

      {/* 구분선 */}
      <div className="w-[90%] h-px bg-gray-300 mx-auto mb-4"></div>

      {/* 문서 목록 */}
      <div className="flex flex-col">
        {/* 문서 종류 */}
        <button className="w-full text-left p-4 text-xl flex gap-2 hover:bg-gray-200  cursor-pointer hover:opacity-70 transition-opacity">
          <div>아이콘</div>
          <div>아이디어</div>
        </button>

        {/* 문서 추가 */}
        <button className="w-full text-left p-4 text-xl font-medium text-gray-400 hover:bg-gray-200  cursor-pointer hover:opacity-70 transition-opacity">
          + 추가하기
        </button>
      </div>

      {/* 구분선 */}
      <div className="w-[90%] h-px bg-gray-300 mt-auto mx-auto mb-4"></div>

      {/* 사이드바 하단 */}
      <div className="pb-70">
        {/* 유저 목록 */}
        <div className="p-4 text-xl flex gap-2">
          <div>아이콘</div>
          <div>유저 이름</div>
        </div>
      </div>
    </div>
  );
}
