import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DoctorApp from './doctor/DoctorApp';
import ToolsApp from './tools/ToolsApp';
import './index.css';

// /doctor = practice cockpit, /tools = personal intern aide, else the patient app.
const path = window.location.pathname;
const root = path.startsWith('/doctor') ? <DoctorApp /> : path.startsWith('/tools') ? <ToolsApp /> : <App />;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{root}</React.StrictMode>
);
