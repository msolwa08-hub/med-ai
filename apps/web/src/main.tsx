import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DoctorApp from './doctor/DoctorApp';
import './index.css';

// The doctor cockpit lives at /doctor; everything else is the patient app.
const isDoctor = window.location.pathname.startsWith('/doctor');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isDoctor ? <DoctorApp /> : <App />}
  </React.StrictMode>
);
