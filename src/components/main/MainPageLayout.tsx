import { useState } from 'react';
import { Outlet } from 'react-router';
import MainSideBar from './MainSideBar';
import MainHeaderBar from './MainHeaderBar';

export default function MainPageLayout() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const toggleSideBar = () => {
    setIsSideBarOpen((prev) => !prev);
  };

  return (
    <div className="h-screen flex">
      <MainSideBar isSideBarOpen={isSideBarOpen} toggleSideBar={toggleSideBar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeaderBar isSideBarOpen={isSideBarOpen} toggleSideBar={toggleSideBar} />
        <main className="flex-1 bg-white overflow-auto">
          <Outlet></Outlet>
        </main>
      </div>
    </div>
  );
}
