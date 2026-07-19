import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingPage from './LandingPage';
import { VersionBadge } from './components/VersionBadge';

const ChatView = lazy(() => import('./components/ChatView'));
const DoctorApp = lazy(() => import('./doctor/DoctorAppLazy'));
const ToolsApp = lazy(() => import('./tools/ToolsAppLazy'));
const ClerkApp = lazy(() => import('./clerk/ClerkApp'));
const WardApp = lazy(() => import('./ward/WardApp'));

type Route = 'landing' | 'chat' | 'doctor' | 'tools' | 'clerk' | 'ward';

function getRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  if (params.get('s')) return 'chat';
  if (path === '/doctor') return 'doctor';
  if (path === '/tools') return 'tools';
  if (path === '/clerk') return 'clerk';
  if (path === '/ward') return 'ward';
  // Auto-route to tools if the user has already set up their key
  if (path === '/' && localStorage.getItem('medai_tools_key')) return 'tools';
  return 'landing';
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-ink-soft">Loading…</span>
      </div>
    </div>
  );
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
      return <Suspense fallback={<RouteFallback />}><ChatView sessionId={sessionId} /></Suspense>;
    }
    if (route === 'doctor') return <Suspense fallback={<RouteFallback />}><DoctorApp onBack={() => navigate('landing')} /></Suspense>;
    if (route === 'tools') return <Suspense fallback={<RouteFallback />}><ToolsApp onBack={() => navigate('landing')} /></Suspense>;
    if (route === 'clerk') return <Suspense fallback={<RouteFallback />}><ClerkApp onBack={() => navigate('landing')} /></Suspense>;
    if (route === 'ward') return <Suspense fallback={<RouteFallback />}><WardApp onBack={() => navigate('landing')} /></Suspense>;
    return <LandingPage onNavigate={navigate} />;
  })();

  return (
    <>
      {view}
      <VersionBadge />
    </>
  );
}
