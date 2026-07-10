import type { ChecklistSection } from '../config/examChecklists';
import { EscapeHatch } from './EscapeHatch';
import { WhyButton } from './WhyButton';

// ─── Exam checklist ──────────────────────────────────────────────────────────
// Big tap rows (≥44px), teal check animation, mandatory items amber until
// checked, n/m progress. Checked state lives with the patient (persisted
// additively) and serializes into the examination text.

export function ExamChecklist({ sections, checked, customNote, onToggle, onNote }: {
  sections: ChecklistSection[];
  /** itemId → checked. */
  checked: Record<string, boolean>;
  customNote: string;
  onToggle: (itemId: string, on: boolean) => void;
  onNote: (v: string) => void;
}) {
  const all = sections.flatMap(s => s.items);
  const done = all.filter(i => checked[i.id]).length;

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Exam checklist</h3>
        <span
          className={`text-xs font-medium rounded-full px-2.5 py-1 ${
            done === all.length && all.length > 0 ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-mute'
          }`}
        >
          {done}/{all.length} checked
        </span>
      </div>

      {sections.map(s => (
        <div key={s.id}>
          <p className="text-[11px] font-semibold text-brand-700/70 uppercase tracking-wider mb-1.5">{s.title}</p>
          <div className="divide-y divide-gray-50">
            {s.items.map(item => {
              const on = Boolean(checked[item.id]);
              const pendingMandatory = item.mandatory && !on;
              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl transition-colors ${
                    pendingMandatory ? 'bg-amber-50/70 dark:bg-amber-400/10' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggle(item.id, !on)}
                    className="flex items-start gap-3 flex-1 text-left min-h-[44px] px-2 py-2.5 group"
                    aria-pressed={on}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                        on
                          ? 'bg-brand-600 border-brand-600 scale-100'
                          : pendingMandatory
                            ? 'border-amber-400 bg-surface group-hover:border-amber-500'
                            : 'border-line-strong bg-surface group-hover:border-brand-400'
                      }`}
                    >
                      <span
                        className={`text-white text-xs font-bold transition-transform duration-200 ${on ? 'scale-100' : 'scale-0'}`}
                      >
                        ✓
                      </span>
                    </span>
                    <span className={`text-sm leading-snug ${on ? 'text-ink-mute line-through decoration-brand-300' : 'text-ink'}`}>
                      {item.label}
                      {pendingMandatory && (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wide text-amber-600 font-semibold no-underline inline-block">
                          required
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="pt-2 pr-1 shrink-0">
                    <WhyButton why={item.why} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <EscapeHatch
        value={customNote}
        onChange={onNote}
        placeholder="Other examination findings…"
      />
    </div>
  );
}
