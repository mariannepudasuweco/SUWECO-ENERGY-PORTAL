import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/supabaseClient';
import App from './App.tsx';
import './index.css';
import './mountReact';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);