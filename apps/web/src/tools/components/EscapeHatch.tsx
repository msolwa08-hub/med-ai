import { useState } from 'react';

// ─── Escape hatch ────────────────────────────────────────────────────────────
// Every structured block (cascade, smart block, checklist, treatment set)
// ends with this: an unobtrusive way to capture the outlier, the bizarre
// presentation, the thing the chips didn't anticipate. Zero-typing is the
// default — but there is ALWAYS somewhere for free text to go.

export function EscapeHatch({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const expanded = open || value.trim().length > 0;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-ink-mute hover:text-brand-700 transition-colors min-h-[44px] px-1 text-left"
      >
        + Add custom note
      </button>
    );
  }

  return (
    <div>
      <p className="text-[11px] text-ink-mute mb-1">Custom note</p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Anything the options above didn’t capture…'}
        rows={2}
        autoFocus={open && !value}
        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
      />
    </div>
  );
}
