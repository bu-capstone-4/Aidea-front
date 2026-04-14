import React from 'react';

interface HeaderBarProps {
  openSideBar: boolean;
  toggleSideBar: () => void;
}

export default function MainHeaderBar({ openSideBar, toggleSideBar }: HeaderBarProps) {
  return (
    <div>
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
    </div>
  );
}
