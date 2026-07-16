import { DEPARTMENTS, SUB_DEPARTMENTS, type DeptId } from '../config/departments';
import { deptIcon } from '../lib/icons';
import { subDeptIcon } from './SubDeptSelector';
import { ThemeToggle } from './ThemeToggle';
import { storage } from '../../storage';
import { Trash2 } from 'lucide-react';

const APP_VERSION = '2.2.0';

export function SettingsPanel({ dept, subDept, onDept, onSubDept, onClearData }: {
  dept: DeptId;
  subDept: string | null;
  onDept: (d: DeptId) => void;
  onSubDept: (s: string | null) => void;
  onClearData: () => void;
}) {
  const deptInfo = DEPARTMENTS.find(d => d.id === dept)!;
  const subDeptOptions = SUB_DEPARTMENTS[dept];

  return (
    <div className="space-y-6">
      {/* Department */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">Current rotation</h4>
        <div className="grid grid-cols-2 gap-2">
          {DEPARTMENTS.map(d => {
            const Icon = deptIcon(d.id);
            const active = d.id === dept;
            return (
              <button
                key={d.id}
                onClick={() => onDept(d.id)}
                className={`flex items-center gap-2 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors text-left ${
                  active
                    ? 'bg-brand-50 border-brand-200 text-brand-800'
                    : 'bg-surface border-line text-ink-soft hover:border-brand-200 hover:bg-brand-50/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{d.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sub-department */}
      {subDeptOptions && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">Ward / unit</h4>
          <div className="grid grid-cols-2 gap-2">
            {subDeptOptions.map(s => {
              const Icon = subDeptIcon(s.id);
              const active = s.id === subDept;
              return (
                <button
                  key={s.id}
                  onClick={() => onSubDept(s.id)}
                  className={`flex items-center gap-2 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-brand-50 border-brand-200 text-brand-800'
                      : 'bg-surface border-line text-ink-soft hover:border-brand-200 hover:bg-brand-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Appearance */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">Appearance</h4>
        <div className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3">
          <span className="text-sm text-ink">Theme</span>
          <ThemeToggle />
        </div>
      </section>

      {/* Data */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-mute mb-3">Data</h4>
        <button
          onClick={() => {
            if (confirm('Clear all patient data and settings? This cannot be undone.')) {
              onClearData();
            }
          }}
          className="w-full flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3 text-sm text-ink-soft hover:text-danger hover:border-danger/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear all data
        </button>
      </section>

      {/* Version */}
      <div className="pt-2 text-center">
        <p className="text-xs text-ink-mute">MedAI Intern Tools v{APP_VERSION}</p>
      </div>
    </div>
  );
}
