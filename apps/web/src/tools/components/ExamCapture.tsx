import { useState } from 'react';
import type { ChecklistItem, ChecklistSection } from '../config/examChecklists';
import { EscapeHatch } from './EscapeHatch';
import { WhyButton } from './WhyButton';
import { Check, ChevronDown, Sparkles } from 'lucide-react';

// ─── Exam capture — values ARE the record ────────────────────────────────────
// The value is the capture. Vitals are a compact value grid (typing the number
// IS the record); every pertinent exam target is a finding row — tap NAD or type
// the actual finding. Nothing is required; a value existing is the only "done".
//
// The exam is FOCUSED, not exhaustive: the top block is driven by the engine's
// differential (the ≤8 signs that discriminate the leading diagnoses), so you
// examine what the story implicates. The full department survey is one tap away
// but never in the way.

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

/** Serialization-friendly stem: drop teaching parentheticals, trailing "?",
 *  and the ": enumerated teaching detail" tail — the enumeration is full of
 *  trigger words ("…convulsions, lethargic…") that must not enter the record
 *  as if they were findings; the typed value carries the substance. */
export function findingStem(label: string): string {
  return label.split(':')[0].replace(/\s*\([^)]*\)/g, '').replace(/\?\s*$/, '').trim();
}

function FindingRow({ item, value, onSet }: {
  item: ChecklistItem;
  value: string;
  onSet: (v: string) => void;
}) {
  const isNad = value === 'NAD';
  const hasFinding = value.trim().length > 0 && !isNad;
  return (
    <div
      className={`rounded-xl border px-3 py-2 transition-colors ${
        hasFinding ? 'border-warn/40 bg-warn/[0.05]' : isNad ? 'border-brand-200 bg-brand-50/50' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm leading-snug flex-1 min-w-0 ${value.trim() ? 'text-ink' : 'text-ink-soft'}`}>
          {findingStem(item.label)}
        </span>
        <button
          type="button"
          onClick={() => onSet(isNad ? '' : 'NAD')}
          aria-pressed={isNad}
          className={`inline-flex items-center gap-1 shrink-0 min-h-[44px] px-2.5 rounded-pill text-xs font-medium border transition-colors ${
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
          value={isNad ? '' : value}
          placeholder="finding…"
          onChange={e => onSet(e.target.value)}
          className="mt-1 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute/50 focus:outline-none border-b border-transparent focus:border-brand-300 pb-0.5 transition-colors"
        />
      )}
    </div>
  );
}

export function ExamCapture({ vitals, focus, survey, values, customNote, onValues, onNote, historyEmpty }: {
  /** The always-on universal vitals items (rendered as a value grid). */
  vitals: ChecklistItem[];
  /** The differential-driven focused exam (engine kind:'exam' features). */
  focus: ChecklistItem[];
  /** The full department survey — optional, one tap away. */
  survey: ChecklistSection[];
  /** itemId → captured value ('NAD' or the actual finding / vital reading). */
  values: Record<string, string>;
  customNote: string;
  onValues: (next: Record<string, string>) => void;
  onNote: (v: string) => void;
  historyEmpty?: boolean;
}) {
  const [surveyOpen, setSurveyOpen] = useState(false);
  const captured = Object.values(values).filter(v => v.trim()).length;
  const surveyCount = survey.reduce((a, s) => a + s.items.length, 0);
  const set = (id: string, v: string) => onValues({ ...values, [id]: v });

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Examination</h3>
        <span
          className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 ${
            captured > 0 ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-mute'
          }`}
        >
          {captured} captured
        </span>
      </div>

      {/* ── Vitals: a value grid. Typing the number IS the capture. ── */}
      {vitals.length > 0 && (
        <div>
          <p className="text-2xs font-semibold text-brand-700/70 uppercase tracking-wider mb-2">Vitals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vitals.map(item => {
              const meta = VITAL_META[item.id] ?? { label: findingStem(item.label), placeholder: '' };
              const v = values[item.id] ?? '';
              return (
                <label
                  key={item.id}
                  className={`block rounded-xl border px-3 py-2 transition-colors ${
                    v.trim() ? 'border-brand-300 bg-brand-50/60' : 'border-line bg-surface-alt/50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-semibold ${v.trim() ? 'text-brand-800' : 'text-ink-soft'}`}>{meta.label}</span>
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

      {/* ── FOCUSED: the exam the differential asks for. ── */}
      {focus.length > 0 ? (
        <div>
          <p className="flex items-center gap-1.5 text-2xs font-semibold text-brand-700 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden /> Focused exam
          </p>
          <div className="space-y-1.5">
            {focus.map(item => (
              <FindingRow key={item.id} item={item} value={values[item.id] ?? ''} onSet={v => set(item.id, v)} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-soft bg-surface-alt border border-line rounded-xl px-3 py-2 leading-relaxed">
          {historyEmpty
            ? 'Focused exam targets appear once the differential is generated.'
            : 'Awaiting differential — use the full survey below.'}
        </p>
      )}

      {/* ── Full survey: everything else, one tap away, never in the way. ── */}
      {surveyCount > 0 && (
        <div className="rounded-xl border border-line">
          <button
            type="button"
            onClick={() => setSurveyOpen(o => !o)}
            aria-expanded={surveyOpen}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="text-xs font-medium text-ink-soft">Full survey ({surveyCount})</span>
            <ChevronDown className={`w-4 h-4 text-ink-mute transition-transform ${surveyOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>
          {surveyOpen && (
            <div className="px-3 pb-3 pt-0.5 space-y-4 border-t border-line/70">
              {survey.map(s => (
                <div key={s.id}>
                  <p className="text-2xs font-semibold text-brand-700/70 uppercase tracking-wider mb-1.5 mt-3">{s.title}</p>
                  <div className="space-y-1.5">
                    {s.items.map(item => (
                      <FindingRow key={item.id} item={item} value={values[item.id] ?? ''} onSet={v => set(item.id, v)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <EscapeHatch value={customNote} onChange={onNote} placeholder="Anything else found on examination…" />
    </div>
  );
}
