import { useState } from 'react';
import { Zap, Check } from 'lucide-react';
import type { TreatmentSet } from '../config/treatmentSets';
import { Card } from './ui';
import { EscapeHatch } from './EscapeHatch';
import { WhyButton } from './WhyButton';

// ─── Treatment set card ──────────────────────────────────────────────────────
// A clickable protocol card: every item is a toggle row whose detail is the
// procedural smart default (gauge, rate, dose, timing). Standard-of-care
// items come pre-selected — opting OUT is the deliberate tap. "Add N selected
// to plan" serializes the selection as label — detail lines into the
// problem's management text, editable after.

export function TreatmentSetCard({ set, onAdd }: {
  set: TreatmentSet;
  /** Receives one "label — detail" line per selected item (+ custom note). */
  onAdd: (lines: string[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(set.items.map(i => [i.id, i.defaultOn]))
  );
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  const n = set.items.filter(i => selected[i.id]).length;

  function add() {
    const lines = set.items.filter(i => selected[i.id]).map(i => `${i.label} — ${i.detail}`);
    if (note.trim()) lines.push(note.trim());
    if (lines.length === 0) return;
    onAdd(lines);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Card elevation="e1" className="p-5 space-y-3">
      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Zap className="w-4 h-4 text-brand-600 shrink-0" aria-hidden /> {set.title}
      </h4>
      <div className="divide-y divide-line">
        {set.items.map(item => {
          const on = Boolean(selected[item.id]);
          return (
            <div key={item.id} className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setSelected(prev => ({ ...prev, [item.id]: !on }))}
                className="flex items-start gap-3 flex-1 text-left min-h-[44px] px-1 py-2.5 group"
                aria-pressed={on}
              >
                <span
                  className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    on ? 'bg-brand-600 border-brand-600' : 'border-line-strong bg-surface group-hover:border-brand-400'
                  }`}
                >
                  {on && <Check className="w-3.5 h-3.5 text-white" aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${on ? 'text-ink' : 'text-ink-mute'}`}>
                    {item.label}
                  </span>
                  <span className={`block text-sm leading-snug ${on ? 'text-ink-soft' : 'text-ink-mute'}`}>
                    {item.detail}
                  </span>
                </span>
              </button>
              <div className="pt-2 shrink-0">
                <WhyButton why={item.why} />
              </div>
            </div>
          );
        })}
      </div>

      <EscapeHatch value={note} onChange={setNote} placeholder="Extra plan line for this problem…" />

      <button
        type="button"
        onClick={add}
        disabled={n === 0 && !note.trim()}
        className={`w-full min-h-[44px] rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
          added
            ? 'bg-brand-50 text-brand-700 border border-brand-200'
            : 'bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white'
        }`}
      >
        {added ? (<><Check className="w-4 h-4" aria-hidden /> Added to plan</>) : `Add ${n} selected to plan`}
      </button>
    </Card>
  );
}
