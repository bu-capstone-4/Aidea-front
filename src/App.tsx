import { Route, Routes } from 'react-router';
import LandingPage from '@/pages/LandingPage';
import MainPage from '@/pages/MainPage';
import CreatePage from '@/pages/CreatePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<MainPageLayout />}>
        <Route path="/main/:docId" element={<MainPage />} />
      </Route>
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  );
}

export default App;
