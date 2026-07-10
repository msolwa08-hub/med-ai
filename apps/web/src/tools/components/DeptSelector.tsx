import { DEPARTMENTS, type DeptId } from '../config/departments';

// ─── DEPARTMENT SELECTOR ────────────────────────────────────────────────────

export function DeptSelector({ onSelect }: { onSelect: (d: DeptId) => void }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    pink: 'bg-pink-50 border-pink-200 hover:border-pink-400',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    red: 'bg-red-50 border-red-200 hover:border-red-400',
    rose: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-400',
  };

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <img src="/medai-icon.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-ink text-2xl font-bold">Intern Tools</h1>
        <p className="text-ink-mute text-sm mt-2">Select your department to get started</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {DEPARTMENTS.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`${colorMap[d.color]} border rounded-2xl p-5 text-center transition-all duration-150 cursor-pointer group`}
          >
            <div className="text-3xl mb-2">{d.icon}</div>
            <p className="text-ink font-medium text-sm">{d.label}</p>
            <p className="text-ink-mute text-xs mt-0.5">{d.abbr}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
