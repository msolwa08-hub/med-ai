import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';

// ─── STAGE CARD — progressive disclosure for optional detail ─────────────────
// A quiet collapsible section. Deliberately NOT a step: no numbers, no
// checkmarks, no done-state — nothing here is required, in any order, ever
// (M-GLANCE: the record is never "incomplete"). The icon+title row and a
// one-line summary are all a collapsed section shows.

export function StageCard({
  title, icon: Icon, summary, open, onToggle, children,
}: {
  /** Accepted for call-site compatibility; intentionally unused — sections
   *  are not steps. */
  index?: number;
  done?: boolean;
  title: string;
  icon: LucideIcon;
  /** One-line filled-state description shown when collapsed. */
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <section
      className={`rounded-card border bg-surface transition-shadow ${
        open ? 'border-brand-200 shadow-card-hover' : 'border-line shadow-card'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left group focus:outline-none focus-visible:shadow-focus rounded-card"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <Icon className={`w-4 h-4 shrink-0 ${open ? 'text-brand-700' : 'text-ink-mute'}`} aria-hidden />
            <span className={`text-[15px] font-semibold tracking-tight ${open ? 'text-ink' : 'text-ink-soft'}`}>{title}</span>
          </span>
          {!open && summary && (
            <span className="block text-[13px] text-ink-mute truncate mt-0.5 pl-6">{summary}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-ink-mute transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line/70">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
