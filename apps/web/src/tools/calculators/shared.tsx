import React from 'react';

// ─── CALCULATORS ─────────────────────────────────────────────────────────────

export function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <h4 className="text-sm font-semibold text-ink mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-ink-mute w-40 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
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
  const c = { blue: 'text-brand-700', green: 'text-emerald-700', yellow: 'text-yellow-600', red: 'text-red-600', pink: 'text-pink-600' };
  return (
    <div className={`mt-3 text-sm font-medium ${c[color as keyof typeof c] ?? 'text-brand-700'}`}>
      {label}: {value}
    </div>
  );
}
