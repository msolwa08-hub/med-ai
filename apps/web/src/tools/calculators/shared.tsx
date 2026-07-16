import React from 'react';
import { Card } from '../components/ui';

// ─── CALCULATORS ─────────────────────────────────────────────────────────────

export function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card elevation="e1" className="p-4">
      <h4 className="text-sm font-semibold text-ink mb-3">{title}</h4>
      {children}
    </Card>
  );
}

let rowCounter = 0;
export function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  const id = React.useMemo(() => `calc-${++rowCounter}`, []);
  return (
    <div className="flex items-center gap-3 py-1">
      <label htmlFor={id} className="text-xs text-ink-mute w-40 shrink-0">{label}</label>
      <div className="flex-1">{children && React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children}</div>
    </div>
  );
}

export function NumInput({ value, onChange, min, max, placeholder }: {
  value: number | ''; onChange: (v: number | '') => void; min?: number; max?: number; placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      placeholder={placeholder ?? '0'}
      className="w-full bg-surface border border-line-strong rounded px-2 py-1 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
    />
  );
}

export function Result({ label, value, color = 'blue' }: { label: string; value: string; color?: string }) {
  // Tokenized onto the confidence-band scale: green/positive results read as
  // "reassuring", yellow/warn as caution, red/danger as urgent — the same
  // ramp the rest of the app uses for severity. blue/pink stay the single
  // brand accent for purely informational (non-graded) values.
  const c = { blue: 'text-brand-700', green: 'text-positive', yellow: 'text-warn', red: 'text-danger', pink: 'text-brand-700' };
  return (
    <div className={`mt-3 text-sm font-medium ${c[color as keyof typeof c] ?? 'text-brand-700'}`}>
      {label}: {value}
    </div>
  );
}
