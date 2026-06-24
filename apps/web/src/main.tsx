import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DoctorApp from './doctor/DoctorApp';
import ToolsApp from './tools/ToolsApp';
import LandingPage from './LandingPage';
import './index.css';

// / = portal landing, /patient = history taker, /doctor = practice cockpit, /tools = intern aide
const path = window.location.pathname;
let root: React.ReactElement;
if (path.startsWith('/doctor')) root = <DoctorApp />;
else if (path.startsWith('/tools')) root = <ToolsApp />;
else if (path.startsWith('/patient')) root = <App />;
else root = <LandingPage />;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{root}</React.StrictMode>
);
