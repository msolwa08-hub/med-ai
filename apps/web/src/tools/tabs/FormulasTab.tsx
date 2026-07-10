import { useState } from 'react';
import { DEPARTMENTS, type DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { CALCULATORS, suggestCalculators } from '../calculators';
import { SectionHead } from '../components/ui';

// ─── FORMULAS TAB ───────────────────────────────────────────────────────────

export function FormulasTab({ dept, patient }: { dept: DeptId; patient: Patient }) {
  const [calc, setCalc] = useState('');

  const relevant = CALCULATORS.filter(c => c.depts.includes(dept));
  const others = CALCULATORS.filter(c => !c.depts.includes(dept));
  const suggested = suggestCalculators(patient)
    .map(s => ({ ...s, meta: CALCULATORS.find(c => c.id === s.calc) }))
    .filter(s => s.meta);

  const ActiveCalc = calc ? CALCULATORS.find(c => c.id === calc)?.component : undefined;

  return (
    <div className="space-y-4">
      {suggested.length > 0 && (
        <div className="bg-surface border border-line shadow-sm rounded-2xl p-5">
          <SectionHead>Suggested for this patient</SectionHead>
          <div className="flex flex-wrap gap-2">
            {suggested.map(s => (
              <button
                key={s.calc}
                onClick={() => setCalc(calc === s.calc ? '' : s.calc)}
                title={`Suggested because: ${s.reason}`}
                className={`text-sm px-3.5 py-2 rounded-full border transition-colors ${
                  calc === s.calc
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-brand-50 border-brand-200 text-brand-800 hover:border-brand-400'
                }`}
              >
                ✨ {s.meta!.label}
                <span className={`ml-1.5 text-[11px] ${calc === s.calc ? 'text-brand-100' : 'text-brand-600/70'}`}>{s.reason}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHead>Recommended for {DEPARTMENTS.find(d => d.id === dept)?.label}</SectionHead>
        <div className="flex flex-wrap gap-2">
          {relevant.map(c => (
            <button
              key={c.id}
              onClick={() => setCalc(calc === c.id ? '' : c.id)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                calc === c.id
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-surface border-line text-ink-soft hover:border-line-strong'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <SectionHead>Other Calculators</SectionHead>
          <div className="flex flex-wrap gap-2">
            {others.map(c => (
              <button
                key={c.id}
                onClick={() => setCalc(calc === c.id ? '' : c.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  calc === c.id
                    ? 'bg-brand-600 border-brand-500 text-white'
                    : 'bg-surface border-line text-ink-mute hover:border-line-strong hover:text-ink-soft'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {calc && ActiveCalc && (
        <div className="mt-2"><ActiveCalc /></div>
      )}
    </div>
  );
}
