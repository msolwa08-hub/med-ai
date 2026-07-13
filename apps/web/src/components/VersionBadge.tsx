import { useEffect, useState } from 'react';

// ─── VERSION BADGE ───────────────────────────────────────────────────────────
// A tiny, always-visible build marker so "which version am I looking at?" is
// answerable from a phone in one glance. The sha comes from the SERVER at
// runtime (/health, Render's RENDER_GIT_COMMIT) — no build-time injection to
// go stale, and a cached old bundle will still reveal itself by disagreeing
// with what the user expects.

export function VersionBadge() {
  const [sha, setSha] = useState('');
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setSha(typeof d?.sha === 'string' ? d.sha : ''))
      .catch(() => {});
  }, []);
  if (!sha) return null;
  return (
    <div
      aria-hidden
      className="fixed bottom-1 left-2 z-50 text-[10px] leading-none text-ink-mute/60 select-none pointer-events-none"
    >
      v-{sha}
    </div>
  );
}
