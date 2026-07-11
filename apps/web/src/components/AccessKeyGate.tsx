import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Stethoscope, Activity, FileText } from 'lucide-react';
import { Button } from '../tools/components/ui';

interface Props {
  label: string;
  storageKey: string;
  onKey: (key: string) => void;
  validate: (key: string) => Promise<boolean>;
}

const PROMISES = [
  { icon: Stethoscope, text: 'A live differential as you clerk' },
  { icon: Activity, text: 'The focused exam + tests that discriminate' },
  { icon: FileText, text: 'The note falls out at the end' },
];

export function AccessKeyGate({ onKey, validate }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reduce = useReducedMotion();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await validate(input.trim());
      if (ok) onKey(input.trim());
      else setError('That key wasn’t recognised. Check it and try again.');
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand + one-line promise — warmth before the password box. */}
        <div className="text-center mb-7">
          <img src="/medai-icon.svg" alt="" className="w-14 h-14 mx-auto mb-4 rounded-2xl shadow-card" />
          <h1 className="text-ink text-2xl font-bold tracking-tight">MedAI</h1>
          <p className="text-ink-soft text-sm mt-1.5">The clinical brain beside you — Intern Aide</p>
        </div>

        <div className="rounded-card border border-line bg-surface shadow-elevated p-6">
          <ul className="space-y-2.5 mb-5">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-ink-soft">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-500/15 shrink-0">
                  <Icon className="w-4 h-4 text-brand-600 dark:text-brand-300" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="sr-only">Access key</span>
              <input
                type="password"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter your tools key"
                className="w-full bg-surface-alt border border-line-strong rounded-xl px-4 py-3 text-[15px] text-ink placeholder:text-ink-mute transition-shadow focus:outline-none focus:border-brand-500 focus:shadow-focus"
                autoFocus
              />
            </label>
            {error && <p className="text-band-exclude text-sm">{error}</p>}
            <Button type="submit" size="md" loading={loading} disabled={!input} className="w-full">
              {loading ? 'Verifying…' : 'Continue'}
            </Button>
          </form>
        </div>

        <p className="text-center text-2xs text-ink-mute mt-4">Beta — for the clinician who holds the pen. Not a diagnosis.</p>
      </motion.div>
    </div>
  );
}
