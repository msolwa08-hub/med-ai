import { DEPARTMENTS, type DeptId } from '../config/departments';

// ─── SUB-DEPARTMENT SELECTOR ────────────────────────────────────────────────
// A second, ward-level pick inside a department where the clinical picture
// genuinely differs (labour vs antenatal vs postnatal vs gynae within O&G) —
// this choice narrows both the exam fields shown and the AI's questioning.

export function SubDeptSelector({ dept, options, onSelect, onBack }: {
  dept: DeptId;
  options: { id: string; label: string; icon: string }[];
  onSelect: (s: string) => void;
  onBack: () => void;
}) {
  const deptInfo = DEPARTMENTS.find(d => d.id === dept)!;
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors">
          ← Back to departments
        </button>
        <div className="text-3xl mb-3">{deptInfo.icon}</div>
        <h1 className="text-gray-900 text-2xl font-bold">{deptInfo.label}</h1>
        <p className="text-gray-500 text-sm mt-2">Which ward or unit is this patient on?</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {options.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="bg-white border border-gray-200 hover:border-teal-400 hover:bg-teal-50/40 rounded-2xl p-5 text-center transition-all duration-150 cursor-pointer shadow-sm"
          >
            <div className="text-3xl mb-2">{s.icon}</div>
            <p className="text-gray-800 font-medium text-sm">{s.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
