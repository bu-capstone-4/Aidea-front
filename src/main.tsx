import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '@/App';
import { BrowserRouter } from 'react-router';

async function enableMocking() {
  // if (import.meta.env.DEV) {
  //   const { worker } = await import('@/mocks/browser');
  //   return worker.start({ onUnhandledRequest: 'bypass' });
  // }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});
