import React, { useState, useEffect, Suspense, lazy } from 'react';
import { VersionBadge } from './components/VersionBadge';

const ChatView = lazy(() => import('./components/ChatView'));
const DoctorApp = lazy(() => import('./doctor/DoctorAppLazy'));
const ClerkApp = lazy(() => import('./clerk/ClerkApp'));

// 2026-07-30 — this app is the Reasoning Clerk and nothing else. The Intern
// Tools console and the Inpatient Ward were deleted, and with them the landing
// page whose only job was choosing between the three. The clerk's own intake
// card is the front door now: describe a patient, get a board.
// The patient chat (?s=…) and the doctor cockpit (/doctor) are a separate
// product line reached by their own links, so they stay routable.
type Route = 'clerk' | 'chat' | 'doctor';

function getRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  if (params.get('s')) return 'chat';
  if (window.location.pathname === '/doctor') return 'doctor';
  return 'clerk';
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

  function goClerk() {
    window.history.pushState({}, '', '/');
    setRoute('clerk');
  }

  const view = (() => {
    if (route === 'chat') {
      const sessionId = new URLSearchParams(window.location.search).get('s') ?? '';
      return <Suspense fallback={<RouteFallback />}><ChatView sessionId={sessionId} /></Suspense>;
    }
    if (route === 'doctor') {
      return <Suspense fallback={<RouteFallback />}><DoctorApp onBack={goClerk} /></Suspense>;
    }
    return <Suspense fallback={<RouteFallback />}><ClerkApp /></Suspense>;
  })();

  return (
    <>
      {view}
      <VersionBadge />
    </>
  );
}
