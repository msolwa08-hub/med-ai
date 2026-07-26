import { useEffect, useState } from 'react';

// ─── VERSION BADGE ───────────────────────────────────────────────────────────
// A build marker so "which version am I looking at?" is answerable from a phone.
// The sha comes from the SERVER at runtime (/health, Render's RENDER_GIT_COMMIT)
// — no build-time injection to go stale, and a cached old bundle will still
// reveal itself by disagreeing with what the user expects.
//
// It used to float in a black pill over the top-right corner, which put debug
// furniture on top of live clinical content — on the clerk it landed across the
// patient's own line. It now sits quietly at the very bottom of the page, below
// everything, in the flow: still one glance away, never over the work.

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
      className="pointer-events-none select-none pb-3 pt-1 text-center font-mono text-[9px] leading-none text-ink-soft/40"
    >
      {APP_VERSION}{sha ? `-${sha}` : ''}
    </div>
  );
}
