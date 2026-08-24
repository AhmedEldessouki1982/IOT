import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const Apartment2DPage = lazy(() => import('./apartment2d/Apartment2DPage'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {window.location.pathname.startsWith('/2d') ? <Apartment2DPage /> : <App />}
    </Suspense>
  </React.StrictMode>,
);
