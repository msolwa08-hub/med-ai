import { useEffect, useState } from 'react';

// ─── Theme ───────────────────────────────────────────────────────────────────
// The Calm Clinical tokens are CSS-variable backed, so switching theme is a
// single [data-theme] flip on <html>. Preference is one of 'light' | 'dark' |
// 'system'; 'system' tracks the OS setting live. Applied synchronously at boot
// (see applyStoredTheme, called from main.tsx) so there is no flash.

export type ThemePref = 'light' | 'dark' | 'system';
const KEY = 'medai_theme';

function systemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function readPref(): ThemePref {
  const v = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as ThemePref | null;
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref;
}

function apply(pref: ThemePref) {
  const resolved = resolve(pref);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

// Called once, synchronously, before React mounts — kills the flash of wrong theme.
export function applyStoredTheme() {
  try { apply(readPref()); } catch { /* SSR / no-DOM safety */ }
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref);

  // Re-apply on change and keep 'system' tracking the OS live.
  useEffect(() => {
    apply(pref);
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  function setTheme(next: ThemePref) {
    try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
    setPref(next);
  }

  const resolved = resolve(pref);
  // The toggle cycles the two explicit modes (the common case); a long-press or
  // settings surface can restore 'system' later if wanted.
  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return { pref, resolved, setTheme, toggle };
}
