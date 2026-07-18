import React, { useEffect, useRef } from 'react';
import clerkFragment from './clerk.html?raw';

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

export default function ClerkApp({ onBack }: { onBack: () => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; id?: string; text?: string } | null;
      if (!data || data.type !== 'medai-generate' || !data.id) return;
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      try {
        const key = localStorage.getItem('medai_tools_key') ?? '';
        const res = await fetch('/tools/clerk-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tools-key': key },
          body: JSON.stringify({ text: data.text ?? '' }),
        });
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? 'Add your tools key first (Intern Tools), then try again.'
              : 'The reasoning service is unavailable right now — try a worked example.',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e1718' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          borderBottom: '1px solid rgba(148,163,163,0.18)',
          background: '#0e1718',
          color: '#e9f0ef',
          flex: 'none',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#5eead4',
            background: 'rgba(45,212,191,0.12)',
            border: '1px solid rgba(45,212,191,0.25)',
            borderRadius: 8,
            padding: '5px 11px',
            cursor: 'pointer',
          }}
        >
          ← MedAI
        </button>
        <span style={{ fontSize: 12, letterSpacing: '0.02em', color: '#8ba3a3' }}>
          Reasoning clerk · beta
        </span>
      </div>
      <iframe
        ref={iframeRef}
        title="MedAI reasoning clerk"
        srcDoc={srcDoc}
        style={{ flex: 1, width: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
