import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter'; // self-hosted, CSP-safe, offline
import './index.css';
import App from './App';
import { applyStoredTheme } from './lib/theme';

applyStoredTheme(); // set [data-theme] before first paint — no flash of wrong theme

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
