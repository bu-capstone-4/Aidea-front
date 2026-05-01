import { useState } from 'react';
import MainSideBar from '@/components/main/MainSideBar';
import MainHeaderBar from '@/components/main/MainHeaderBar';
import MainContent from '@/components/main/MainContent';

export default function MainPage() {
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const toggleSideBar = () => setIsSideBarOpen((prev) => !prev);

  return (
    <div className="h-screen flex">
      <MainSideBar isSideBarOpen={isSideBarOpen} toggleSideBar={toggleSideBar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeaderBar />
        <MainContent />
      </div>
    </div>
  );
}
