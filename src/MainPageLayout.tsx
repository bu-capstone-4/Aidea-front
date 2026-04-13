import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

export default function MainPageLayout() {
  const [openSideBar, setOpenSideBar] = useState(true);
  const toggleSideBar = () => {
    setOpenSideBar((prev) => !prev);
  };

  return (
    <div className="h-screen flex">
      {/* 사이드바 */}
      <div
        className={`bg-gray-100 flex-col h-screen flex transition-all duration-300 ease-in-out  whitespace-nowrap overflow-hidden ${openSideBar ? 'w-64' : 'w-0'}`}
      >
        {/* 팀스페이스명, 사이드바 닫기 */}
        <div className="flex justify-between p-4 ">
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

      {/* 상단바 */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between p-4 border-b border-gray-300">
          <div className="flex gap-4">
            {!openSideBar && (
              <div>
                <button
                  onClick={toggleSideBar}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                >
                  사이드바 열기
                </button>
              </div>
            )}

            <div>해당 위치 경로</div>
          </div>
          <div className="flex gap-4">
            <button className="cursor-pointer hover:opacity-70 transition-opacity">초대</button>
            <button className="cursor-pointer hover:opacity-70 transition-opacity">정보</button>
            <button className="cursor-pointer hover:opacity-70 transition-opacity">내보내기</button>
          </div>
        </header>

        <main className="flex-1 bg-white">
          <Outlet></Outlet>
        </main>
      </div>
    </div>
  );
}
