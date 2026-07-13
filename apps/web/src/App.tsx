import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import ChatView from './components/ChatView';
import { DoctorApp } from './doctor/DoctorApp';
import { ToolsApp } from './tools/ToolsApp';
import { VersionBadge } from './components/VersionBadge';

type Route = 'landing' | 'chat' | 'doctor' | 'tools';

function getRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  if (params.get('s')) return 'chat';
  if (path === '/doctor') return 'doctor';
  if (path === '/tools') return 'tools';
  return 'landing';
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(r: Route) {
    const url = r === 'landing' ? '/' : `/${r}`;
    window.history.pushState({}, '', url);
    setRoute(r);
  }

  const view = (() => {
    if (route === 'chat') {
      const sessionId = new URLSearchParams(window.location.search).get('s') ?? '';
      return <ChatView sessionId={sessionId} />;
    }
    if (route === 'doctor') return <DoctorApp onBack={() => navigate('landing')} />;
    if (route === 'tools') return <ToolsApp onBack={() => navigate('landing')} />;
    return <LandingPage onNavigate={navigate} />;
  })();

  return (
    <>
      {view}
      <VersionBadge />
    </>
  );
}
