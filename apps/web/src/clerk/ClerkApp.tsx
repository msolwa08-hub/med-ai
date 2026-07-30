import React, { useEffect, useRef, useState } from 'react';
import { AccessKeyGate } from '../components/AccessKeyGate';
import clerkFragment from './clerk.html?raw';

const KEY_STORAGE = 'medai_tools_key';

// Every call to the generator is key-gated, and until now the ONLY place that
// key could be entered was the Intern Tools console — which has been deleted.
// That left the clerk permanently unreachable: describe a patient, get "add
// your tools key first", with nowhere left to add it. The clerk now carries its
// own gate, so the front door and the key live in the same place.
async function validateToolsKey(key: string): Promise<boolean> {
  const res = await fetch('/tools/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tools-key': key },
    body: '{}',
  });
  return res.ok;
}

// The reasoning clerk is a self-contained, offline likelihood-ratio engine.
// It is mounted here as an isolated document so it inherits its own theming and
// carries no dependencies on the surrounding app shell. Free-text case
// generation is routed back through this host (which holds the tools key) via
// postMessage, so the sandboxed clerk can reach the key-gated API.
const srcDoc =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<style>html,body{margin:0;background:transparent}</style></head><body>' +
  clerkFragment +
  '</body></html>';

export default function ClerkApp() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState<string>(() => localStorage.getItem(KEY_STORAGE) ?? '');

  // Wake the free-tier API (sleeps when idle) as soon as the clerk mounts, so the
  // container is warm before the user submits a presentation.
  useEffect(() => {
    fetch('/health').catch(() => {});
  }, []);

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const data = e.data as {
        type?: string;
        id?: string;
        text?: string;
        phase?: string;
        dx?: Array<{ id: string; name: string }>;
      } | null;
      if (!data) return;
      // A warm ping from the clerk: just poke the health endpoint.
      if (data.type === 'medai-warm') {
        fetch('/health').catch(() => {});
        return;
      }
      // The board runs sandboxed with no access to this origin, so it asks the
      // host to put a finished note on the clipboard. This handler was missing:
      // every Copy in the Docs tab posted a message nobody listened for and
      // reported "Copied ✓" regardless. Clipboard writes can reject (no user
      // gesture in this frame, denied permission) — fall back to the textarea
      // trick rather than swallowing it.
      if (data.type === 'medai-copy') {
        const text = data.text ?? '';
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch { /* nothing more to try */ }
          ta.remove();
        }
        return;
      }
      if (data.type !== 'medai-generate' || !data.id) return;
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      try {
        const key = localStorage.getItem('medai_tools_key') ?? '';
        const res = await fetch('/tools/clerk-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tools-key': key },
          body: JSON.stringify({ text: data.text ?? '', phase: data.phase, dx: data.dx }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            // The stored key stopped being accepted (rotated, or revoked).
            // Clear it so the gate comes back rather than leaving the clinician
            // staring at an error with no way to re-enter one.
            localStorage.removeItem(KEY_STORAGE);
            setKey('');
            throw new Error('That access key is no longer valid — enter it again.');
          }
          let detail = '';
          try {
            const b = (await res.json()) as { error?: string };
            if (b && typeof b.error === 'string') detail = b.error;
          } catch {
            /* body was not JSON */
          }
          throw new Error(
            (detail || 'The reasoning service is unavailable right now — try again in a moment') +
              ` (HTTP ${res.status})`,
          );
        }
        const pack = await res.json();
        win.postMessage({ type: 'medai-generated', id: data.id, pack }, '*');
      } catch (err) {
        win.postMessage(
          { type: 'medai-generated', id: data.id, error: (err as Error).message },
          '*',
        );
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!key) {
    return (
      <AccessKeyGate
        label="Reasoning Clerk — enter your access key"
        storageKey={KEY_STORAGE}
        onKey={(k) => { localStorage.setItem(KEY_STORAGE, k); setKey(k); }}
        validate={validateToolsKey}
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      title="MedAI reasoning clerk"
      srcDoc={srcDoc}
      style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
    />
  );
}
