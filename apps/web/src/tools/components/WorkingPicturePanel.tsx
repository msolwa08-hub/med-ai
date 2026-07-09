import type { WorkingPicture, WeightedDifferential } from '../toolsApi';
import { WhyButton } from './WhyButton';

// ─── WORKING PICTURE — the bedside loop, on screen ───────────────────────────
// A ranked differential with live confidence bars, what would move each one
// (the discriminators), and — when results have landed — the visible shift and
// the consultant's narrative of what changed. This is the app's heart made
// visual: findings in, a weighted picture out, results move it before your eyes.

const BAND_STYLE: Record<WeightedDifferential['band'], { dot: string; label: string; text: string }> = {
  confirmed: { dot: 'bg-emerald-500', label: 'confirmed', text: 'text-emerald-700' },
  likely: { dot: 'bg-teal-500', label: 'likely', text: 'text-teal-700' },
  possible: { dot: 'bg-amber-400', label: 'possible', text: 'text-amber-700' },
  'must-exclude': { dot: 'bg-red-500', label: 'must exclude', text: 'text-red-700' },
};

const STATUS_STYLE: Record<string, string> = {
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  suggested: 'bg-gray-50 text-gray-600 border-gray-200',
};

function ConfidenceBar({ value, band }: { value: number; band: WeightedDifferential['band'] }) {
  const fill = band === 'must-exclude' ? 'bg-red-400' : band === 'possible' ? 'bg-amber-400' : band === 'confirmed' ? 'bg-emerald-500' : 'bg-teal-500';
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full ${fill} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

function DifferentialCard({ d }: { d: WeightedDifferential }) {
  const band = BAND_STYLE[d.band];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2.5">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${band.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-gray-900">{d.dx}</span>
            <span className={`text-[11px] uppercase tracking-wide ${band.text}`}>{band.label}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-lg font-bold tabular-nums text-gray-900">{d.confidence}%</span>
          {d.shift && (
            <div className={`text-[11px] tabular-nums ${d.shift.from < d.confidence ? 'text-emerald-600' : 'text-amber-600'}`}>
              {d.shift.from < d.confidence ? '▲' : '▼'} was {d.shift.from}%
            </div>
          )}
        </div>
      </div>

      <ConfidenceBar value={d.confidence} band={d.band} />

      {d.shift?.because && (
        <p className="text-[12px] text-gray-500 italic leading-snug">↳ {d.shift.because}</p>
      )}

      <div className="flex items-start gap-2">
        <p className="text-[13px] text-gray-600 leading-snug flex-1">{d.why}</p>
        {d.why && <WhyButton why={`${d.dx}\n\nFor: ${d.supporting.join('; ') || '—'}\nAgainst: ${d.against.join('; ') || '—'}\n\n${d.why}`} />}
      </div>

      {d.discriminators.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">What would move this</p>
          {d.discriminators.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`shrink-0 text-[10px] uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${STATUS_STYLE[t.status] ?? STATUS_STYLE.suggested}`}>
                {t.status === 'done' ? '✓ done' : t.status}
              </span>
              <p className="text-[12.5px] text-gray-700 leading-snug flex-1">
                <span className="font-medium">{t.test}</span>
                {t.priority === 'now' && <span className="ml-1 text-red-600 font-semibold">· now</span>}
                <span className="text-gray-500"> — {t.moves}</span>
              </p>
            </div>
          ))}
        </div>
      )}
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
  return (
    <div data-testid="working-picture" className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Working picture</h3>
          <p className="text-xs text-gray-500">The live differential — what it is, how sure, and what would prove it.</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="shrink-0 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : '✨'}
          {picture ? 'Update' : generateLabel}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {picture?.narrative && (
        <div className="rounded-xl bg-white border border-teal-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">What changed</p>
          <p className="text-[13.5px] text-gray-800 leading-relaxed">{picture.narrative}</p>
        </div>
      )}

      {picture && picture.differentials.length > 0 && (
        <div className="space-y-2.5">
          {picture.differentials.map((d, i) => <DifferentialCard key={i} d={d} />)}
        </div>
      )}

      {picture?.mustNotMiss && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700">Must not miss</span>
          <p className="text-[13.5px] text-red-900 leading-snug mt-0.5">{picture.mustNotMiss}</p>
        </div>
      )}

      {picture && picture.managementNow.length > 0 && (
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Do now — justified by the current picture</p>
          <ul className="space-y-1">
            {picture.managementNow.map((m, i) => (
              <li key={i} className="text-[13.5px] text-gray-800 leading-snug flex gap-2">
                <span className="text-teal-500 shrink-0">{i + 1}.</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {picture && picture.safety.length > 0 && (
        <div className="space-y-1.5">
          {picture.safety.map((w, i) => (
            <div key={i} className={`text-[13px] rounded-xl px-4 py-2.5 border ${w.severity === 'BLOCK' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <span className="font-semibold">{w.severity === 'BLOCK' ? '⛔' : '⚠️'} {w.drug}</span>
              <span className="text-[11px] uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
              <p className="mt-0.5 leading-relaxed">{w.reason}</p>
            </div>
          ))}
        </div>
      )}

      {!picture && !loading && (
        <p className="text-sm text-gray-400 text-center py-4">
          Clerk the patient, then generate the working picture — a ranked differential with what would prove each one.
        </p>
      )}
    </div>
  );
}
