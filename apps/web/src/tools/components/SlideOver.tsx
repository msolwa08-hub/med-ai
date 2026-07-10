import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

// ─── SLIDE-OVER — a right-hand sheet for secondary surfaces ──────────────────
// The full editable record and generated documents live here: one tap away,
// never occupying the bedside canvas. Esc / backdrop / X all close it.

export function SlideOver({ open, onClose, title, children, wide }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`absolute inset-y-0 right-0 w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} bg-canvas shadow-elevated flex flex-col`}
            initial={reduce ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-line bg-surface/85 backdrop-blur-md shrink-0">
              <h3 className="text-[15px] font-semibold text-ink tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid place-items-center w-9 h-9 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
