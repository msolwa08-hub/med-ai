import type { ChecklistSection } from '../config/examChecklists';
import { EscapeHatch } from './EscapeHatch';
import { WhyButton } from './WhyButton';
import { Check } from 'lucide-react';

// ─── Exam capture — values ARE the record ────────────────────────────────────
// Replaces the tick-checklist: ticking "BP recorded" while typing the value
// somewhere else was double work that documented ceremony, not findings.
// Here the value is the capture: vitals are a compact value grid (typing the
// number IS the record), and every pertinent exam target is a finding row —
// one tap for NAD, or type the actual finding. "Done" is derived from a value
// existing; there is no checkbox anywhere. The list stays history-driven: the
// targeted section is built from the presentation, so history comes first and
// the exam asks only what this patient's story makes pertinent.

/** Short label + realistic placeholder for the universal vitals grid. */
export const VITAL_META: Record<string, { label: string; placeholder: string }> = {
  'vit-bp': { label: 'BP', placeholder: '120/80' },
  'vit-hr': { label: 'HR', placeholder: '88' },
  'vit-rr': { label: 'RR', placeholder: '18' },
  'vit-temp': { label: 'Temp', placeholder: '36.8' },
  'vit-sats': { label: 'SpO2', placeholder: '98% RA' },
  'vit-gcs': { label: 'GCS', placeholder: '15 (E4V5M6)' },
  'vit-glucose': { label: 'Glucose', placeholder: '5.4' },
};

/** Serialization-friendly stem: drop teaching parentheticals + trailing "?". */
export function findingStem(label: string): string {
  return label.replace(/\s*\([^)]*\)/g, '').replace(/\?\s*$/, '').trim();
}

export function ExamCapture({ sections, values, customNote, onValues, onNote, historyEmpty }: {
  sections: ChecklistSection[];
  /** itemId → captured value ('NAD' or the actual finding / vital reading). */
  values: Record<string, string>;
  customNote: string;
  onValues: (next: Record<string, string>) => void;
  onNote: (v: string) => void;
  historyEmpty?: boolean;
}) {
  const vitalsSection = sections.find(s => s.id === 'vitals');
  const findingSections = sections.filter(s => s.id !== 'vitals');
  const captured = Object.values(values).filter(v => v.trim()).length;

  const set = (id: string, v: string) => onValues({ ...values, [id]: v });

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Examination — values are the record</h3>
        <span
          className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 ${
            captured > 0 ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-mute'
          }`}
        >
          {captured} captured
        </span>
      </div>

      {historyEmpty && (
        <p className="text-xs text-ink-soft bg-surface-alt border border-line rounded-xl px-3 py-2 leading-relaxed">
          Take the history first — this list is built from it, so the targeted block below asks only what the story makes pertinent.
        </p>
      )}

      {/* ── Vitals: a value grid. Typing the number IS the capture. ── */}
      {vitalsSection && (
        <div>
          <p className="text-2xs font-semibold text-brand-700/70 uppercase tracking-wider mb-2">{vitalsSection.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vitalsSection.items.map(item => {
              const meta = VITAL_META[item.id] ?? { label: findingStem(item.label), placeholder: '' };
              const v = values[item.id] ?? '';
              return (
                <label
                  key={item.id}
                  className={`block rounded-xl border px-3 py-2 transition-colors ${
                    v.trim()
                      ? 'border-brand-300 bg-brand-50/60'
                      : 'border-line bg-surface-alt/50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-semibold ${v.trim() ? 'text-brand-800' : 'text-ink-soft'}`}>
                      {meta.label}
                    </span>
                    <WhyButton why={item.why} />
                  </span>
                  <input
                    type="text"
                    inputMode="text"
                    value={v}
                    placeholder={meta.placeholder}
                    onChange={e => set(item.id, e.target.value)}
                    className="w-full min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-mute/60 focus:outline-none pt-0.5 pb-1"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Pertinent exam targets: one tap = NAD, or type the finding. ── */}
      {findingSections.map(s => (
        <div key={s.id}>
          <p className="text-2xs font-semibold text-brand-700/70 uppercase tracking-wider mb-1.5">{s.title}</p>
          <div className="space-y-1.5">
            {s.items.map(item => {
              const v = values[item.id] ?? '';
              const isNad = v === 'NAD';
              const hasFinding = v.trim().length > 0 && !isNad;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border px-3 py-2 transition-colors ${
                    hasFinding
                      ? 'border-warn/40 bg-warn/[0.05]'
                      : isNad
                        ? 'border-brand-200 bg-brand-50/50'
                        : 'border-line bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm leading-snug flex-1 min-w-0 ${v.trim() ? 'text-ink' : 'text-ink-soft'}`}>
                      {findingStem(item.label)}
                    </span>
                    <button
                      type="button"
                      onClick={() => set(item.id, isNad ? '' : 'NAD')}
                      aria-pressed={isNad}
                      className={`inline-flex items-center gap-1 shrink-0 min-h-[36px] px-2.5 rounded-pill text-xs font-medium border transition-colors ${
                        isNad
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'bg-surface border-line-strong text-ink-soft hover:border-brand-400 hover:text-brand-700'
                      }`}
                    >
                      {isNad && <Check className="w-3 h-3" aria-hidden />} NAD
                    </button>
                    <span className="shrink-0"><WhyButton why={item.why} /></span>
                  </div>
                  {!isNad && (
                    <input
                      type="text"
                      value={isNad ? '' : v}
                      placeholder="finding…"
                      onChange={e => set(item.id, e.target.value)}
                      className="mt-1 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute/50 focus:outline-none border-b border-transparent focus:border-brand-300 pb-0.5 transition-colors"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <EscapeHatch
        value={customNote}
        onChange={onNote}
        placeholder="Anything else found on examination…"
      />
    </div>
  );
}
