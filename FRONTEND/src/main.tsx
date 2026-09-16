import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (window.location.pathname === '/') {
  localStorage.removeItem('smart_att_authed');
  localStorage.removeItem('smart_att_user');
  localStorage.removeItem('smart_att_token');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
