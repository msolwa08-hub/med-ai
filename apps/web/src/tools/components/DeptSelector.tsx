import { DEPARTMENTS, type DeptId } from '../config/departments';

// ─── DEPARTMENT SELECTOR ────────────────────────────────────────────────────

export function DeptSelector({ onSelect }: { onSelect: (d: DeptId) => void }) {
  // Single accent system: neutral surface cards, the department emoji carries
  // identity, a brand-tinted lift on hover. One confident accent, not eight.
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <img src="/medai-icon.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-ink text-2xl font-bold tracking-tight">Intern Tools</h1>
        <p className="text-ink-soft text-sm mt-2">Select your department to get started</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {DEPARTMENTS.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="group rounded-card border border-line bg-surface p-5 text-center shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus:outline-none focus-visible:shadow-focus"
          >
            <div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-xl bg-surface-alt text-3xl transition-colors group-hover:bg-brand-50">
              {d.icon}
            </div>
            <p className="text-ink font-medium text-sm">{d.label}</p>
            <p className="text-ink-mute text-xs mt-0.5">{d.abbr}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
