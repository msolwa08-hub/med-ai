import { useState } from 'react';
import type { TreatmentSet } from '../config/treatmentSets';
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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">⚡ {set.title}</h4>
      <div className="divide-y divide-gray-50">
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
                    on ? 'bg-teal-600 border-teal-600' : 'border-gray-300 bg-white group-hover:border-teal-400'
                  }`}
                >
                  {on && <span className="text-white text-xs font-bold">✓</span>}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-medium ${on ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  <span className={`block text-[13px] leading-snug ${on ? 'text-gray-600' : 'text-gray-300'}`}>
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
        className={`w-full min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
          added
            ? 'bg-teal-50 text-teal-700 border border-teal-200'
            : 'bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white'
        }`}
      >
        {added ? '✓ Added to plan' : `Add ${n} selected to plan`}
      </button>
    </div>
  );
}
