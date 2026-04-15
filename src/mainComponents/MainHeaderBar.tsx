import React from 'react';

interface HeaderBarProps {
  isSideBarOpen: boolean;
  toggleSideBar: () => void;
}

export default function MainHeaderBar({ isSideBarOpen, toggleSideBar }: HeaderBarProps) {
  return (
    <div>
      <header className="flex justify-between p-4 border-b border-gray-300 h-14">
        <div className="flex gap-4">
          {!isSideBarOpen && (
            <div>
              <button
                onClick={toggleSideBar}
                className="cursor-pointer hover:opacity-70 transition-opacity"
              >
                사이드바 열기
              </button>
            </div>
          )}

          <span className="text-ink-muted">해당 위치 경로</span>
        </div>
        <div className="flex gap-4">
          <button className="cursor-pointer bg-surface text-ink font-medium rounded-md px-3 h-8 text-base">
            초대
          </button>
          <button className="cursor-pointer rounded-full bg-primary size-8 flex items-center justify-center text-white font-semibold text-sm">
            정보
          </button>
          <button className="cursor-pointer bg-ink text-white font-semibold rounded-md px-3 h-8 text-base">
            ↑ 내보내기
          </button>
        </div>
      </header>
    </div>
  );
}
