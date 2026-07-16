import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, ListChecks, ShieldAlert, Ban, CircleDot, Check, X } from 'lucide-react';
import type { WorkingPicture, WeightedDifferential } from '../toolsApi';
import { Spinner, Card } from './ui';

// ─── WORKING PICTURE — the bedside loop, on screen (the hero) ────────────────
// A ranked differential with live, spring-animated confidence bars, what would
// move each one (the discriminators), and — when results have landed — the
// visible shift and the consultant's narrative of what changed. The FIRST
// differential — the leading diagnosis — gets the hero treatment: this is the
// one number the intern is here for. The rest stay compact underneath.

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
    <div className={`w-full rounded-full bg-line overflow-hidden ${hero ? 'h-3' : 'h-2'}`}>
      <motion.div
        className={`h-full rounded-full ${BAND[band].bar}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${value}%` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

function DifferentialCard({ d, reduce, hero }: { d: WeightedDifferential; reduce: boolean | null; hero?: boolean }) {
  const band = BAND[d.band];
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        elevation={hero ? 'hero' : 'e1'}
        className={hero ? 'p-5 sm:p-6 space-y-4 border-brand-100 shadow-glow' : 'p-4 space-y-2.5'}
      >
        <div className="flex items-start gap-2.5">
          <CircleDot className={`shrink-0 ${hero ? 'mt-1.5 w-5 h-5' : 'mt-0.5 w-4 h-4'} ${band.dot}`} aria-hidden />
          <div className="min-w-0 flex-1">
            {hero && <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700 mb-0.5">Leading diagnosis</p>}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={hero ? 'text-2xl sm:text-3xl font-bold text-ink tracking-tight' : 'text-base font-semibold text-ink'}>{d.dx}</span>
              <span className={`uppercase tracking-wide ${hero ? 'text-xs' : 'text-2xs'} ${band.text}`}>{band.label}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <span className={`font-bold tabular-nums text-ink ${hero ? 'text-3xl sm:text-4xl' : 'text-lg'}`}>{d.confidence}%</span>
            {d.shift && d.confidence !== d.shift.from && (() => {
              const delta = d.confidence - d.shift.from;
              const up = delta > 0;
              return (
                <motion.div
                  // re-keyed on the new confidence so the chip springs in every time a result moves this dx
                  key={d.confidence}
                  initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 16 }}
                  title={`was ${d.shift.from}%`}
                  className={`inline-flex items-center gap-0.5 mt-0.5 rounded-full px-1.5 py-0.5 font-bold tabular-nums ${hero ? 'text-xs' : 'text-2xs'} ${up ? 'bg-positive/[0.10] text-positive' : 'bg-warn/[0.12] text-warn'}`}
                >
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? '+' : '−'}{Math.abs(delta)}
                </motion.div>
              );
            })()}
          </div>
        </div>

        <ConfidenceBar value={d.confidence} band={d.band} reduce={reduce} hero={hero} />

        {d.shift?.because && (
          <p className="text-xs text-ink-mute italic leading-snug">↳ {d.shift.because}</p>
        )}

        {d.why && (
          <p className="text-sm text-ink-soft leading-snug">{d.why}</p>
        )}

        {(d.supporting.length > 0 || d.against.length > 0) && (
          <div className="space-y-1.5 rounded-lg bg-surface-alt/60 border border-line px-3 py-2">
            {d.supporting.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-positive">
                  <Check className="w-3 h-3" aria-hidden /> For
                </span>
                <p className="text-xs text-ink leading-snug flex-1">{d.supporting.join(' · ')}</p>
              </div>
            )}
            {d.against.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="shrink-0 inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-warn">
                  <X className="w-3 h-3" aria-hidden /> Against
                </span>
                <p className="text-xs text-ink leading-snug flex-1">{d.against.join(' · ')}</p>
              </div>
            )}
          </div>
        )}

        {d.discriminators.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Discriminating investigations</p>
            {d.discriminators.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`shrink-0 text-xs uppercase tracking-wide rounded-full border px-2 py-0.5 font-medium ${DISC_STATUS[t.status] ?? DISC_STATUS.suggested}`}>
                  {t.status === 'done' ? '✓ done' : t.status}
                </span>
                <p className="text-sm leading-snug flex-1">
                  <span className="font-semibold text-ink">{t.test}</span>
                  {t.priority === 'now' && <span className="ml-1.5 text-danger font-bold">NOW</span>}
                  <span className="text-ink"> — {t.moves}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
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
        <div>
          <h3 className="text-base font-bold text-ink tracking-tight">Working picture</h3>
          <p className="text-xs text-ink-soft">Live differential diagnosis — ranked probability with discriminating investigations.</p>
        </div>
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
        <div className={`space-y-2.5 transition-opacity duration-300 ${refreshing ? 'opacity-45' : 'opacity-100'}`}>
          {hero && <DifferentialCard key={`${hero.dx}-hero`} d={hero} reduce={reduce} hero />}
          {rest.map((d, i) => <DifferentialCard key={`${d.dx}-${i}`} d={d} reduce={reduce} />)}
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
            <ListChecks className="w-3.5 h-3.5" /> Immediate management — indicated by current clinical picture
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
          Enter or select a presenting complaint to generate the differential diagnosis.
        </p>
      )}
    </div>
  );
}
