import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

// ─── STAGE CARD — progressive disclosure for the capture stream ──────────────
// The bedside canvas is a sequence of stages (Complaint → Story → Examine →
// Results). Only the active stage is expanded; the rest collapse to a single
// calm row: number, title, and a one-line summary of what's already captured.
// This is the core anti-congestion mechanic: the page is always ~4 quiet rows
// plus ONE working area, whatever the depth of the underlying forms.

export function StageCard({
  index, title, icon: Icon, summary, done, open, onToggle, children,
}: {
  index: number;
  title: string;
  icon: LucideIcon;
  /** One-line filled-state description shown when collapsed. */
  summary?: string;
  /** Renders the step marker as a confident check. */
  done?: boolean;
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
        <span
          className={`grid place-items-center w-8 h-8 rounded-full shrink-0 text-[13px] font-semibold transition-colors ${
            done
              ? 'bg-brand-600 text-white'
              : open
                ? 'bg-brand-50 text-brand-700'
                : 'bg-surface-alt text-ink-mute group-hover:text-ink-soft'
          }`}
        >
          {done ? <Check className="w-4 h-4" /> : index}
        </span>
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
