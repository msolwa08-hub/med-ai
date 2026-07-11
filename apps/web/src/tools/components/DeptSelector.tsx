import { motion, useReducedMotion } from 'framer-motion';
import { DEPARTMENTS, type DeptId } from '../config/departments';
import { deptIcon } from '../lib/icons';

// ─── DEPARTMENT SELECTOR ────────────────────────────────────────────────────
// Single accent system: neutral surface cards, a lucide icon (not emoji)
// carries department identity in a brand-tinted tile, with a brand-tinted
// lift on hover. One confident accent, not eight. Cards fade-up in a gentle
// stagger (reduced-motion aware) so the grid arrives with intent.

export function DeptSelector({ onSelect }: { onSelect: (d: DeptId) => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center p-6 pt-[9vh] sm:pt-[14vh]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-9 text-center max-w-md"
      >
        <img src="/medai-icon.svg" alt="" className="w-12 h-12 mx-auto mb-5 rounded-2xl shadow-card" />
        <h1 className="text-ink text-3xl font-bold tracking-tight">Intern Tools</h1>
        <p className="text-ink-soft text-base mt-2.5">Pick your department — the aide tunes to it.</p>
      </motion.div>
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.03 } } }}
      >
        {DEPARTMENTS.map(d => {
          const Icon = deptIcon(d.id);
          return (
            <motion.button
              key={d.id}
              variants={{ hidden: reduce ? {} : { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              onClick={() => onSelect(d.id)}
              className="group rounded-card border border-line bg-surface p-5 text-center shadow-card-hover transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated focus:outline-none focus-visible:shadow-focus"
            >
              <div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-lg bg-brand-50 dark:bg-brand-500/15 transition-colors group-hover:bg-brand-100 dark:group-hover:bg-brand-500/25">
                <Icon className="w-6 h-6 text-brand-600 dark:text-brand-300" />
              </div>
              <p className="text-ink font-medium text-sm">{d.label}</p>
              <p className="text-ink-mute text-xs mt-0.5">{d.abbr}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
