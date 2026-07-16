import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, ListChecks, ShieldAlert, Ban, CircleDot, Check, X, ChevronDown } from 'lucide-react';
import type { WorkingPicture, WeightedDifferential } from '../toolsApi';
import { Spinner, Card } from './ui';

const BAND: Record<WeightedDifferential['band'], { bar: string; dot: string; text: string; label: string }> = {
  confirmed: { bar: 'bg-band-confirmed', dot: 'text-band-confirmed', text: 'text-band-confirmed', label: 'confirmed' },
  likely: { bar: 'bg-band-likely', dot: 'text-band-likely', text: 'text-brand-700', label: 'likely' },
  possible: { bar: 'bg-band-possible', dot: 'text-band-possible', text: 'text-band-possible', label: 'possible' },
  'must-exclude': { bar: 'bg-band-exclude', dot: 'text-band-exclude', text: 'text-band-exclude', label: 'must exclude' },
};

const DISC_STATUS: Record<string, string> = {
  done: 'bg-positive/[0.10] text-positive border-positive/25',
  pending: 'bg-brand-50 text-brand-700 border-brand-200',
  suggested: 'bg-surface-alt text-ink-soft border-line-strong',
};

function ConfidenceBar({ value, band, reduce, hero }: { value: number; band: WeightedDifferential['band']; reduce: boolean | null; hero?: boolean }) {
  return (
    <div className={`w-full rounded-full bg-line overflow-hidden ${hero ? 'h-2.5' : 'h-1.5'}`}>
      <motion.div
        className={`h-full rounded-full ${BAND[band].bar}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${value}%` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

function DeltaChip({ d, reduce, size }: { d: WeightedDifferential; reduce: boolean | null; size: 'sm' | 'xs' }) {
  if (!d.shift || d.confidence === d.shift.from) return null;
  const delta = d.confidence - d.shift.from;
  const up = delta > 0;
  return (
    <motion.span
      key={d.confidence}
      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 16 }}
      title={`was ${d.shift.from}%`}
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold tabular-nums ${size === 'sm' ? 'text-xs' : 'text-2xs'} ${up ? 'bg-positive/[0.10] text-positive' : 'bg-warn/[0.12] text-warn'}`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : '−'}{Math.abs(delta)}
    </motion.span>
  );
}

function HeroCard({ d, reduce }: { d: WeightedDifferential; reduce: boolean | null }) {
  const band = BAND[d.band];
  const ixPending = d.discriminators.filter(t => t.status !== 'done').length;
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card elevation="hero" className="p-4 sm:p-5 space-y-2.5 border-brand-100 shadow-glow">
        <div className="flex items-center gap-2.5">
          <CircleDot className={`shrink-0 w-5 h-5 ${band.dot}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{d.dx}</span>
              <span className={`uppercase tracking-wide text-2xs ${band.text}`}>{band.label}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <DeltaChip d={d} reduce={reduce} size="sm" />
            <span className="font-bold tabular-nums text-ink text-2xl sm:text-3xl">{d.confidence}%</span>
          </div>
        </div>

        <ConfidenceBar value={d.confidence} band={d.band} reduce={reduce} hero />

        {d.shift?.because && (
          <p className="text-xs text-ink-mute italic leading-snug">↳ {d.shift.because}</p>
        )}

        {(d.supporting.length > 0 || d.against.length > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
            {d.supporting.length > 0 && (
              <span className="inline-flex items-center gap-1 text-positive">
                <Check className="w-3 h-3" aria-hidden /> {d.supporting.join(' · ')}
              </span>
            )}
            {d.against.length > 0 && (
              <span className="inline-flex items-center gap-1 text-warn">
                <X className="w-3 h-3" aria-hidden /> {d.against.join(' · ')}
              </span>
            )}
          </div>
        )}

        {ixPending > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.discriminators.filter(t => t.status !== 'done').slice(0, 4).map((t, i) => (
              <span key={i} className={`text-2xs rounded-full border px-2 py-0.5 font-medium ${DISC_STATUS[t.status] ?? DISC_STATUS.suggested}`}>
                {t.test}{t.priority === 'now' ? ' NOW' : ''}
              </span>
            ))}
            {ixPending > 4 && <span className="text-2xs text-ink-mute py-0.5">+{ixPending - 4} more</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function CompactRow({ d, reduce }: { d: WeightedDifferential; reduce: boolean | null }) {
  const [open, setOpen] = useState(false);
  const band = BAND[d.band];
  const ixPending = d.discriminators.filter(t => t.status !== 'done').length;
  const hasDetail = d.why || d.supporting.length > 0 || d.against.length > 0 || ixPending > 0;
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-line/60 last:border-b-0"
    >
      <button
        type="button"
        onClick={() => hasDetail && setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 py-2.5 px-1 text-left ${hasDetail ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <CircleDot className={`shrink-0 w-3.5 h-3.5 ${band.dot}`} aria-hidden />
        <span className="text-sm font-semibold text-ink flex-1 min-w-0 truncate">{d.dx}</span>
        <span className={`text-2xs uppercase tracking-wide shrink-0 ${band.text}`}>{band.label}</span>
        <DeltaChip d={d} reduce={reduce} size="xs" />
        <span className="font-bold tabular-nums text-ink text-base shrink-0 w-12 text-right">{d.confidence}%</span>
        {hasDetail && (
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        )}
      </button>

      <div className="px-1">
        <ConfidenceBar value={d.confidence} band={d.band} reduce={reduce} />
      </div>

      {open && (
        <div className="px-1 pb-2.5 pt-1.5 space-y-1.5">
          {d.shift?.because && (
            <p className="text-xs text-ink-mute italic leading-snug">↳ {d.shift.because}</p>
          )}
          {(d.supporting.length > 0 || d.against.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
              {d.supporting.length > 0 && (
                <span className="inline-flex items-center gap-1 text-positive">
                  <Check className="w-3 h-3" aria-hidden /> {d.supporting.join(' · ')}
                </span>
              )}
              {d.against.length > 0 && (
                <span className="inline-flex items-center gap-1 text-warn">
                  <X className="w-3 h-3" aria-hidden /> {d.against.join(' · ')}
                </span>
              )}
            </div>
          )}
          {ixPending > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {d.discriminators.filter(t => t.status !== 'done').map((t, i) => (
                <span key={i} className={`text-2xs rounded-full border px-2 py-0.5 font-medium ${DISC_STATUS[t.status] ?? DISC_STATUS.suggested}`}>
                  {t.test}{t.priority === 'now' ? ' NOW' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <div className="rounded-xl border border-line bg-surface p-5 space-y-3.5">
        <div className="flex justify-between">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-8 w-14 rounded" />
        </div>
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
      {[0, 1].map(i => (
        <div key={i} className="rounded-xl border border-line bg-surface p-4 space-y-3">
          <div className="flex justify-between">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-5 w-10 rounded" />
          </div>
          <div className="skeleton h-2 w-full rounded-full" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function WorkingPicturePanel({
  picture, loading, error, onGenerate, generateLabel, hideManagement,
}: {
  picture?: WorkingPicture;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
  generateLabel: string;
  /** ClerkTab: the "For the paper notes" block owns Ix/Mx there — the hero
   *  stays compact (differential + must-not-miss + safety only). */
  hideManagement?: boolean;
}) {
  const reduce = useReducedMotion();
  const [hero, ...rest] = picture?.differentials ?? [];
  // A refresh over an existing picture: keep the numbers on screen but signal
  // clearly that the tap registered and an update is landing — never wipe the
  // context back to a skeleton.
  const refreshing = loading && !!picture;

  return (
    <div data-testid="working-picture" className="rounded-card border border-brand-100 bg-surface-brand p-4 sm:p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink tracking-tight">Working picture</h3>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 bg-surface border border-line-strong hover:bg-surface-alt disabled:opacity-50 text-ink-soft hover:text-ink text-sm font-medium px-3.5 min-h-[44px] rounded-md transition-colors focus:outline-none focus-visible:shadow-focus"
        >
          {loading ? <Spinner className="w-3.5 h-3.5" /> : picture ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          {picture ? 'Refresh' : generateLabel}
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading && !picture && <Skeleton />}

      {refreshing && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-surface border border-brand-200 px-3.5 py-2"
        >
          <Spinner className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-xs font-medium text-brand-700">
            Re-reading the picture with the new finding<span className="animate-pulse">…</span>
          </span>
        </motion.div>
      )}

      {picture?.narrative && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-surface border border-brand-100 px-4 py-3"
        >
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700 mb-1">What changed</p>
          <p className="text-sm text-ink leading-relaxed">{picture.narrative}</p>
        </motion.div>
      )}

      {(hero || rest.length > 0) && (
        <div className={`transition-opacity duration-300 ${refreshing ? 'opacity-45' : 'opacity-100'}`}>
          {hero && <HeroCard key={`${hero.dx}-hero`} d={hero} reduce={reduce} />}
          {rest.length > 0 && (
            <div className="mt-2 rounded-xl border border-line bg-surface px-3">
              {rest.map((d, i) => <CompactRow key={`${d.dx}-${i}`} d={d} reduce={reduce} />)}
            </div>
          )}
        </div>
      )}

      {picture?.mustNotMiss && (
        <div className="flex items-start gap-2 rounded-xl bg-danger/[0.08] border border-danger/25 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wide text-danger">Must not miss</span>
            <p className="text-sm text-danger leading-snug mt-0.5">{picture.mustNotMiss}</p>
          </div>
        </div>
      )}

      {picture && !hideManagement && picture.managementNow.length > 0 && (
        <div className="rounded-xl bg-surface border border-line px-4 py-3">
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-mute mb-1.5">
            <ListChecks className="w-3.5 h-3.5" /> Immediate management
          </p>
          <ul className="space-y-1">
            {picture.managementNow.map((m, i) => (
              <li key={i} className="text-sm text-ink leading-snug flex gap-2">
                <span className="text-brand-500 font-semibold shrink-0">{i + 1}.</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {picture && picture.safety.length > 0 && (
        <div className="space-y-2">
          {picture.safety.map((w, i) => {
            const isBlock = w.severity === 'BLOCK';
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border-2 ${
                isBlock
                  ? 'bg-danger/[0.06] border-danger/40 text-danger'
                  : 'bg-warn/[0.06] border-warn/30 text-warn'
              }`}>
                <div className={`shrink-0 mt-0.5 grid place-items-center w-7 h-7 rounded-full ${
                  isBlock ? 'bg-danger/15' : 'bg-warn/15'
                }`}>
                  {isBlock ? <Ban className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-base font-bold ${isBlock ? 'text-danger' : 'text-warn'}`}>
                      {isBlock ? 'STOP' : 'CAUTION'} — {w.drug}
                    </span>
                    <span className="text-xs uppercase tracking-wide opacity-50">{w.category}</span>
                  </div>
                  <p className={`mt-1 text-sm leading-relaxed ${isBlock ? 'text-danger/90' : 'text-warn/90'}`}>{w.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!picture && !loading && (
        <p className="text-sm text-ink-mute text-center py-4">
          Select a presenting complaint to begin.
        </p>
      )}
    </div>
  );
}
