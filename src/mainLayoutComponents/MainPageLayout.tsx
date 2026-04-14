import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MainSideBar from './MainSideBar';
import MainHeaderBar from './MainHeaderBar';

export default function MainPageLayout() {
  const [openSideBar, setOpenSideBar] = useState(true);
  const toggleSideBar = () => {
    setOpenSideBar((prev) => !prev);
  };

  return (
    <div className="h-screen flex">
      <MainSideBar openSideBar={openSideBar} toggleSideBar={toggleSideBar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeaderBar openSideBar={openSideBar} toggleSideBar={toggleSideBar} />
        <main className="flex-1 bg-white overflow-auto">
          <Outlet></Outlet>
        </main>
      </div>
    </div>
  );
}
