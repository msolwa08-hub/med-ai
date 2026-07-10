import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, ChevronUp } from 'lucide-react';
import type { WorkingPicture, WeightedDifferential } from '../toolsApi';

// ─── PICTURE SHEET — the bedside loop, pinned on a phone ─────────────────────
// On phones the working picture can't sit beside the capture stream, so it's
// pinned at the bottom instead: a thumb-reachable collapsed bar (top
// differentials at a glance) that expands into a full sheet with the same
// panel + utilities the desktop column shows. Esc / backdrop / handle all
// close it, matching SlideOver's idiom.

const PILL_TINT: Record<WeightedDifferential['band'], string> = {
  confirmed: 'bg-emerald-50 border-emerald-200 text-band-confirmed',
  likely: 'bg-brand-50 border-brand-200 text-brand-700',
  possible: 'bg-amber-50 border-amber-200 text-amber-700',
  'must-exclude': 'bg-rose-50 border-rose-200 text-band-exclude',
};

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function PictureSheet({ picture, children }: {
  picture?: WorkingPicture;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const top = picture?.differentials?.slice(0, 2) ?? [];

  return (
    <div className="lg:hidden">
      {/* Collapsed bar */}
      <button
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open working picture"
        className="fixed inset-x-0 bottom-0 z-30 min-h-[56px] w-full flex items-center gap-2.5 px-4 py-2 bg-surface/95 backdrop-blur-md border-t border-line text-left focus:outline-none focus-visible:shadow-focus"
      >
        <Sparkles className="w-4 h-4 shrink-0 text-brand-600" aria-hidden />
        <span className="text-[13px] font-semibold text-ink shrink-0">Working picture</span>
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {top.length > 0 ? (
            top.map((d, i) => (
              <span
                key={`${d.dx}-${i}`}
                className={`shrink-0 max-w-[45%] inline-flex items-center gap-1 text-[11px] font-medium rounded-pill border px-2 py-1 ${PILL_TINT[d.band]}`}
              >
                {/* The % is the glance — the name truncates, the number never does */}
                <span className="truncate min-w-0">{truncate(d.dx, 14)}</span>
                <span className="shrink-0 font-bold tabular-nums">{d.confidence}%</span>
              </span>
            ))
          ) : (
            <span className="text-[12.5px] text-ink-mute truncate">Tap to build the picture</span>
          )}
        </div>
        <ChevronUp className="w-4 h-4 shrink-0 text-ink-mute" aria-hidden />
      </button>

      {/* Expanded sheet */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Working picture">
            <motion.div
              className="absolute inset-0 bg-ink/25"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[86vh] rounded-t-card bg-canvas shadow-elevated flex flex-col"
              initial={reduce ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={reduce ? undefined : { y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            >
              <button
                onClick={close}
                aria-label="Close working picture"
                className="shrink-0 flex flex-col items-center gap-1.5 pt-2.5 pb-1.5 focus:outline-none"
              >
                <span className="h-1.5 w-10 rounded-full bg-line-strong" aria-hidden />
                <ChevronUp className="w-4 h-4 rotate-180 text-ink-mute" aria-hidden />
              </button>
              <div className="flex-1 overflow-y-auto px-4 pb-5 space-y-3 scrollbar-thin">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
