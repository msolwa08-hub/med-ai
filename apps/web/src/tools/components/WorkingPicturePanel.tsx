import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, ListChecks, ShieldAlert, Ban, CircleDot } from 'lucide-react';
import type { WorkingPicture, WeightedDifferential } from '../toolsApi';
import { WhyButton } from './WhyButton';
import { Spinner } from './ui';

// ─── WORKING PICTURE — the bedside loop, on screen (the hero) ────────────────
// A ranked differential with live, spring-animated confidence bars, what would
// move each one (the discriminators), and — when results have landed — the
// visible shift and the consultant's narrative of what changed. This is the
// app's heart made visual: findings in, a weighted picture out, results move it
// before your eyes.

const BAND: Record<WeightedDifferential['band'], { bar: string; dot: string; text: string; label: string }> = {
  confirmed: { bar: 'bg-band-confirmed', dot: 'text-band-confirmed', text: 'text-band-confirmed', label: 'confirmed' },
  likely: { bar: 'bg-band-likely', dot: 'text-band-likely', text: 'text-brand-700', label: 'likely' },
  possible: { bar: 'bg-band-possible', dot: 'text-band-possible', text: 'text-amber-700', label: 'possible' },
  'must-exclude': { bar: 'bg-band-exclude', dot: 'text-band-exclude', text: 'text-band-exclude', label: 'must exclude' },
};

const DISC_STATUS: Record<string, string> = {
  done: 'bg-emerald-50 text-band-confirmed border-emerald-200',
  pending: 'bg-brand-50 text-brand-700 border-brand-200',
  suggested: 'bg-surface-alt text-ink-soft border-line-strong',
};

function ConfidenceBar({ value, band, reduce }: { value: number; band: WeightedDifferential['band']; reduce: boolean | null }) {
  return (
    <div className="h-2 w-full rounded-full bg-line overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${BAND[band].bar}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${value}%` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

function DifferentialCard({ d, reduce }: { d: WeightedDifferential; reduce: boolean | null }) {
  const band = BAND[d.band];
  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-line bg-surface p-4 space-y-2.5"
    >
      <div className="flex items-start gap-2">
        <CircleDot className={`mt-0.5 w-4 h-4 shrink-0 ${band.dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-ink">{d.dx}</span>
            <span className={`text-[11px] uppercase tracking-wide ${band.text}`}>{band.label}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-lg font-bold tabular-nums text-ink">{d.confidence}%</span>
          {d.shift && (
            <div className={`flex items-center justify-end gap-0.5 text-[11px] tabular-nums ${d.shift.from < d.confidence ? 'text-band-confirmed' : 'text-amber-600'}`}>
              {d.shift.from < d.confidence ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              was {d.shift.from}%
            </div>
          )}
        </div>
      </div>

      <ConfidenceBar value={d.confidence} band={d.band} reduce={reduce} />

      {d.shift?.because && (
        <p className="text-[12px] text-ink-mute italic leading-snug">↳ {d.shift.because}</p>
      )}

      <div className="flex items-start gap-2">
        <p className="text-[13px] text-ink-soft leading-snug flex-1">{d.why}</p>
        {d.why && <WhyButton why={`${d.dx}\n\nFor: ${d.supporting.join('; ') || '—'}\nAgainst: ${d.against.join('; ') || '—'}\n\n${d.why}`} />}
      </div>

      {d.discriminators.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">What would move this</p>
          {d.discriminators.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`shrink-0 text-[10px] uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${DISC_STATUS[t.status] ?? DISC_STATUS.suggested}`}>
                {t.status === 'done' ? '✓ done' : t.status}
              </span>
              <p className="text-[12.5px] text-ink-soft leading-snug flex-1">
                <span className="font-medium text-ink">{t.test}</span>
                {t.priority === 'now' && <span className="ml-1 text-band-exclude font-semibold">· now</span>}
                <span className="text-ink-mute"> — {t.moves}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {[0, 1, 2].map(i => (
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
  picture, loading, error, onGenerate, generateLabel,
}: {
  picture?: WorkingPicture;
  loading: boolean;
  error?: string;
  onGenerate: () => void;
  generateLabel: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div data-testid="working-picture" className="rounded-card border border-brand-100 bg-surface-brand p-4 sm:p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink tracking-tight">Working picture</h3>
          <p className="text-xs text-ink-soft">The live differential — what it is, how sure, and what would prove it.</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium px-4 min-h-[44px] rounded-xl transition-colors focus:outline-none focus-visible:shadow-focus"
        >
          {loading ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {picture ? 'Update' : generateLabel}
        </button>
      </div>

      {error && <p className="text-sm text-band-exclude">{error}</p>}

      {loading && !picture && <Skeleton />}

      {picture?.narrative && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-surface border border-brand-100 px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700 mb-1">What changed</p>
          <p className="text-[13.5px] text-ink leading-relaxed">{picture.narrative}</p>
        </motion.div>
      )}

      {picture && picture.differentials.length > 0 && (
        <div className="space-y-2.5">
          {picture.differentials.map((d, i) => <DifferentialCard key={`${d.dx}-${i}`} d={d} reduce={reduce} />)}
        </div>
      )}

      {picture?.mustNotMiss && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-band-exclude" />
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-band-exclude">Must not miss</span>
            <p className="text-[13.5px] text-rose-900 leading-snug mt-0.5">{picture.mustNotMiss}</p>
          </div>
        </div>
      )}

      {picture && picture.managementNow.length > 0 && (
        <div className="rounded-xl bg-surface border border-line px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-mute mb-1.5">
            <ListChecks className="w-3.5 h-3.5" /> Do now — justified by the current picture
          </p>
          <ul className="space-y-1">
            {picture.managementNow.map((m, i) => (
              <li key={i} className="text-[13.5px] text-ink leading-snug flex gap-2">
                <span className="text-brand-500 font-semibold shrink-0">{i + 1}.</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {picture && picture.safety.length > 0 && (
        <div className="space-y-1.5">
          {picture.safety.map((w, i) => (
            <div key={i} className={`flex items-start gap-2 text-[13px] rounded-xl px-4 py-2.5 border ${w.severity === 'BLOCK' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {w.severity === 'BLOCK' ? <Ban className="w-4 h-4 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
              <div>
                <span className="font-semibold">{w.drug}</span>
                <span className="text-[11px] uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
                <p className="mt-0.5 leading-relaxed">{w.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!picture && !loading && (
        <p className="text-sm text-ink-mute text-center py-4">
          Clerk the patient, then generate the working picture — a ranked differential with what would prove each one.
        </p>
      )}
    </div>
  );
}
