import { motion, useReducedMotion } from 'framer-motion';
import { Stethoscope, Activity, FileText, ArrowRight } from 'lucide-react';

interface Props {
  onNavigate: (route: 'chat' | 'doctor' | 'tools' | 'clerk') => void;
}

const PROMISES = [
  { icon: Stethoscope, text: 'A live differential as you clerk — confidence + reasoning' },
  { icon: Activity, text: 'Investigations chosen to discriminate, not just screen' },
  { icon: FileText, text: 'The note falls out at the end — ward round to discharge' },
];

export default function LandingPage({ onNavigate }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-surface-brand to-transparent"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md text-center"
      >
        <img src="/medai-icon.svg" alt="" className="w-16 h-16 mx-auto mb-5 rounded-2xl shadow-card" />
        <h1 className="text-4xl font-bold text-ink tracking-tight">MedAI</h1>
        <p className="text-ink-soft text-base mt-2">The clinical brain beside you — Intern Aide</p>

        <div className="mt-8 rounded-card border border-line bg-surface shadow-elevated p-6 text-left">
          <ul className="space-y-3 mb-6">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-ink-soft">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-600 dark:text-brand-300" aria-hidden />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onNavigate('tools')}
            className="w-full group inline-flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-white text-base font-medium py-3.5 rounded-xl shadow-card transition-colors focus:outline-none focus-visible:shadow-focus"
          >
            Open Intern Tools
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigate('clerk')}
            className="mt-3 w-full group inline-flex items-center justify-center gap-2 border border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-base font-medium py-3.5 rounded-xl transition-colors focus:outline-none focus-visible:shadow-focus"
          >
            Open Reasoning Clerk
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <p className="mt-6 text-2xs text-ink-mute">
          For healthcare professionals. All AI-generated content requires clinical verification.
        </p>
      </motion.div>
    </div>
  );
}
