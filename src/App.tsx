import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';
import CreatePage from './pages/CreatePage';
import MainPageLayout from './MainPageLayout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<MainPageLayout />}>
        <Route path="/main" element={<MainPage />} />
      </Route>
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  );
}

export default App;
