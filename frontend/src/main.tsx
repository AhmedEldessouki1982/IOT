import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const ApartmentPage = lazy(() => import('./apartment3d/ApartmentPage'));

const is3d = window.location.pathname.startsWith('/3d');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      {is3d ? <ApartmentPage /> : <App />}
    </Suspense>
  </React.StrictMode>,
);
