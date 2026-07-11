import { DEPARTMENTS, type DeptId } from '../config/departments';
import { deptIcon } from '../lib/icons';

// ─── DEPARTMENT SELECTOR ────────────────────────────────────────────────────

export function DeptSelector({ onSelect }: { onSelect: (d: DeptId) => void }) {
  // Single accent system: neutral surface cards, a lucide icon (not emoji)
  // carries department identity in a brand-tinted tile, with a brand-tinted
  // lift on hover. One confident accent, not eight.
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center p-6 pt-[14vh] sm:pt-[16vh]">
      <div className="mb-10 text-center max-w-md">
        <img src="/medai-icon.svg" alt="" className="w-12 h-12 mx-auto mb-5" />
        <h1 className="text-ink text-3xl font-bold tracking-tight">Intern Tools</h1>
        <p className="text-ink-soft text-base mt-2.5">Select your department to get started</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {DEPARTMENTS.map(d => {
          const Icon = deptIcon(d.id);
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className="group rounded-card border border-line bg-surface p-5 text-center shadow-card-hover transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated focus:outline-none focus-visible:shadow-focus"
            >
              <div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-500/15 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25">
                <Icon className="w-6 h-6 text-brand-600 dark:text-brand-300" />
              </div>
              <p className="text-ink font-medium text-sm">{d.label}</p>
              <p className="text-ink-mute text-xs mt-0.5">{d.abbr}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
