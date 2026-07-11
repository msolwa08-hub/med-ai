import {
  CalendarClock, HeartPulse, Users, Venus, Stethoscope, Baby, Utensils, MapPin, type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { DEPARTMENTS, type DeptId } from '../config/departments';
import { deptIcon } from '../lib/icons';

// ─── SUB-DEPARTMENT SELECTOR ────────────────────────────────────────────────
// A second, ward-level pick inside a department where the clinical picture
// genuinely differs (labour vs antenatal vs postnatal vs gynae within O&G) —
// this choice narrows both the exam fields shown and the AI's questioning.

// Sub-departments carry their own emoji in config/departments.ts (back-compat
// for any legacy consumers) but the UI resolves a lucide icon per id here, so
// the selector speaks the same visual language as the department grid. A
// single consistent fallback covers any future sub-dept id we haven't mapped.
const SUB_DEPT_ICONS: Record<string, LucideIcon> = {
  antenatal: CalendarClock,
  labour: HeartPulse,
  postnatal: Users,
  gynae: Venus,
  general: Stethoscope,
  neonatal: Baby,
  malnutrition: Utensils,
};
export function subDeptIcon(id: string): LucideIcon {
  return SUB_DEPT_ICONS[id] ?? MapPin;
}

export function SubDeptSelector({ dept, options, onSelect, onBack }: {
  dept: DeptId;
  options: { id: string; label: string; icon: string }[];
  onSelect: (s: string) => void;
  onBack: () => void;
}) {
  const deptInfo = DEPARTMENTS.find(d => d.id === dept)!;
  const DeptIcon = deptIcon(dept);
  const reduce = useReducedMotion();
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center p-6 pt-[9vh] sm:pt-[14vh]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-9 text-center"
      >
        <button onClick={onBack} className="text-ink-mute hover:text-ink-soft text-sm mb-6 transition-colors">
          ← Back to departments
        </button>
        <div className="mx-auto mb-4 grid place-items-center w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-500/15">
          <DeptIcon className="w-6 h-6 text-brand-600 dark:text-brand-300" />
        </div>
        <h1 className="text-ink text-2xl font-bold">{deptInfo.label}</h1>
        <p className="text-ink-soft text-sm mt-2">Which ward or unit is this patient on?</p>
      </motion.div>
      <motion.div
        className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.04 } } }}
      >
        {options.map(s => {
          const Icon = subDeptIcon(s.id);
          return (
            <motion.button
              key={s.id}
              variants={{ hidden: reduce ? {} : { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              onClick={() => onSelect(s.id)}
              className="group bg-surface border border-line hover:border-brand-200 rounded-card p-5 text-center transition-all duration-150 hover:-translate-y-0.5 shadow-card-hover hover:shadow-elevated focus:outline-none focus-visible:shadow-focus"
            >
              <div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-500/15 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25">
                <Icon className="w-6 h-6 text-brand-600 dark:text-brand-300" />
              </div>
              <p className="text-ink font-medium text-sm">{s.label}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
