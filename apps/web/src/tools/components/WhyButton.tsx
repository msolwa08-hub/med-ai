import { useState } from 'react';

// ─── Why? button ─────────────────────────────────────────────────────────────
// The teaching layer: every non-obvious prompt, checklist item or protocol
// default carries a one-tap rationale. Inline-expands (never a popup) so the
// intern can learn the "why" without leaving the flow.

export function WhyButton({ why }: { why: string }) {
  const [open, setOpen] = useState(false);
  if (!why) return null;
  return (
    <span className="inline-block align-middle">
      <button
        type="button"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className={`text-xs px-1.5 py-0.5 rounded-md transition-colors ${
          open ? 'text-teal-800 bg-teal-50' : 'text-teal-600/70 hover:text-teal-800 hover:bg-teal-50'
        }`}
        aria-expanded={open}
      >
        🔍 Why?
      </button>
      {open && (
        <span
          className="block mt-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 leading-relaxed"
          onClick={e => e.stopPropagation()}
        >
          {why}
        </span>
      )}
    </span>
  );
}
