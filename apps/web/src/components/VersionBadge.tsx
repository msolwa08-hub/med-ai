import { useEffect, useState } from 'react';

// ─── VERSION BADGE ───────────────────────────────────────────────────────────
// A tiny, always-visible build marker so "which version am I looking at?" is
// answerable from a phone in one glance. The sha comes from the SERVER at
// runtime (/health, Render's RENDER_GIT_COMMIT) — no build-time injection to
// go stale, and a cached old bundle will still reveal itself by disagreeing
// with what the user expects.

const APP_VERSION = '2.2.0';

export function VersionBadge() {
  const [sha, setSha] = useState('');
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setSha(typeof d?.sha === 'string' ? d.sha : ''))
      .catch(() => {});
  }, []);
  return (
    <div
      aria-hidden
      className="fixed right-2 z-[999] rounded-full bg-black/70 px-2 py-1 text-[10px] font-mono leading-none text-white shadow-e2 select-none pointer-events-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 3.25rem)' }}
    >
      {APP_VERSION}{sha ? `-${sha}` : ''}
    </div>
  );
}
