import { useState } from 'react';
import { Wind, ChevronDown } from 'lucide-react';
import type { AcidBaseReading } from '../lib/acidBase';

// ─── ACID–BASE MAP — the ABG visual learning aid ─────────────────────────────
// The single highest-teaching investigation visual: it takes the blood gas and
// SHOWS the interpretation an intern struggles to hold in their head — where the
// pH sits, which system is the primary driver and which is compensating (each on
// its own reference-banded number line), the expected-compensation window, the
// anion gap, and the delta–delta — then walks the five bedside steps in words.
// Self-contained, theme-aware SVG (no chart dependency); pure interpretation.

const TONE = {
  danger: '#e11d48',
  warn: '#c2740a',
  ok: '#0b7a6e',
  brand: '#0e7490',
};

function toneForBand(value: number, low?: number, high?: number): keyof typeof TONE {
  if (low !== undefined && value < low) return 'warn';
  if (high !== undefined && value > high) return 'warn';
  return 'ok';
}

/** A horizontal reference-banded number line with a value marker and an optional
 *  "expected" window (used to show the expected respiratory compensation). */
function BandGauge({
  value, low, high, domainMin, domainMax, unit, expected,
}: {
  value: number;
  low: number;
  high: number;
  domainMin: number;
  domainMax: number;
  unit: string;
  expected?: { low: number; high: number };
}) {
  const w = 300, h = 46;
  const padX = 10;
  const innerW = w - padX * 2;
  // Keep the marker on-screen even when the value runs off the fixed domain.
  const min = Math.min(domainMin, value - (domainMax - domainMin) * 0.06);
  const max = Math.max(domainMax, value + (domainMax - domainMin) * 0.06);
  const X = (v: number) => padX + ((v - min) / (max - min)) * innerW;
  const trackY = 20;
  const tone = TONE[toneForBand(value, low, high)];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label="Reference-banded value gauge" className="block">
      {/* track */}
      <line x1={padX} x2={w - padX} y1={trackY} y2={trackY} stroke="rgb(var(--line-strong) / 0.5)" strokeWidth={2} strokeLinecap="round" />
      {/* expected-compensation window (drawn under the normal band) */}
      {expected && (
        <rect x={X(expected.low)} y={trackY - 9} width={Math.max(2, X(expected.high) - X(expected.low))} height={18}
          fill={TONE.brand} opacity={0.10} stroke={TONE.brand} strokeWidth={1} strokeDasharray="3 2" />
      )}
      {/* normal band */}
      <rect x={X(low)} y={trackY - 6} width={Math.max(2, X(high) - X(low))} height={12} rx={2}
        fill={TONE.ok} opacity={0.16} />
      <line x1={X(low)} x2={X(low)} y1={trackY - 6} y2={trackY + 6} stroke={TONE.ok} strokeWidth={1} opacity={0.5} />
      <line x1={X(high)} x2={X(high)} y1={trackY - 6} y2={trackY + 6} stroke={TONE.ok} strokeWidth={1} opacity={0.5} />
      {/* value marker */}
      <line x1={X(value)} x2={X(value)} y1={trackY - 11} y2={trackY + 11} stroke={tone} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={X(value)} cy={trackY} r={4.5} fill={tone} />
      <text x={Math.min(w - padX, Math.max(padX, X(value)))} y={trackY - 15} fill={tone} fontSize={12} fontWeight={700} textAnchor="middle">{value}</text>
      {/* band labels */}
      <text x={X(low)} y={h - 2} fill="rgb(var(--ink-mute))" fontSize={8.5} textAnchor="middle">{low}</text>
      <text x={X(high)} y={h - 2} fill="rgb(var(--ink-mute))" fontSize={8.5} textAnchor="middle">{high}{unit ? ` ${unit}` : ''}</text>
    </svg>
  );
}

const BADGE: Record<string, string> = {
  primary: 'bg-danger/[0.10] text-danger border-danger/25',
  compensating: 'bg-brand-50 text-brand-700 border-brand-200',
  normal: 'bg-surface-alt text-ink-mute border-line',
};

function GaugeRow({ title, role, children }: { title: string; role?: 'primary' | 'compensating' | 'normal'; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink">{title}</span>
        {role && (
          <span className={`text-2xs font-semibold uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${BADGE[role]}`}>
            {role === 'primary' ? 'primary driver' : role === 'compensating' ? 'compensating' : 'in range'}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function AcidBaseMap({ reading }: { reading: AcidBaseReading }) {
  const [open, setOpen] = useState(true);
  if (!reading.available) return null;

  const { primary, phState, verdict } = reading;
  const respIsPrimary = primary.startsWith('respiratory');
  const metabIsPrimary = primary.startsWith('metabolic');
  const respRole: 'primary' | 'compensating' | 'normal' =
    respIsPrimary ? 'primary' : reading.pco2! < 4.7 || reading.pco2! > 6.0 ? 'compensating' : 'normal';
  const metabRole: 'primary' | 'compensating' | 'normal' =
    metabIsPrimary ? 'primary' : reading.hco3! < 22 || reading.hco3! > 26 ? 'compensating' : 'normal';

  const phTone = phState === 'acidaemia' ? TONE.danger : phState === 'alkalaemia' ? TONE.warn : TONE.ok;

  return (
    <div className="rounded-card border border-brand-100 bg-surface-brand p-4 space-y-4 shadow-card">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-2.5 text-left focus:outline-none focus-visible:shadow-focus rounded-md">
        <Wind className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700">Acid–base map</p>
          <p className="text-sm font-bold text-ink leading-snug">{verdict}</p>
        </div>
        <ChevronDown className={`shrink-0 w-4 h-4 text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="space-y-4">
          {/* pH */}
          <GaugeRow title={`pH ${reading.ph}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold uppercase tracking-wide shrink-0" style={{ color: phTone }}>{phState}</span>
              <div className="flex-1">
                <BandGauge value={reading.ph!} low={7.35} high={7.45} domainMin={7.0} domainMax={7.7} unit="" />
              </div>
            </div>
          </GaugeRow>

          {/* Respiratory / Metabolic drivers */}
          <div className="grid sm:grid-cols-2 gap-4">
            <GaugeRow title="Respiratory · pCO₂" role={respRole}>
              <BandGauge
                value={reading.pco2!} low={4.7} high={6.0} domainMin={2.5} domainMax={9.5} unit="kPa"
                expected={metabIsPrimary ? reading.expectedPco2 : undefined}
              />
            </GaugeRow>
            <GaugeRow title="Metabolic · HCO₃" role={metabRole}>
              <BandGauge value={reading.hco3!} low={22} high={26} domainMin={10} domainMax={38} unit="" />
            </GaugeRow>
          </div>
          {metabIsPrimary && reading.expectedPco2 && (
            <p className="text-2xs text-ink-mute -mt-2">
              <span className="inline-block w-2.5 h-2.5 align-middle rounded-sm border border-brand-400 bg-brand-400/10 mr-1" />
              dashed band = expected pCO₂ ({reading.expectedPco2.low}–{reading.expectedPco2.high} kPa) if compensation is appropriate
            </p>
          )}

          {/* Anion gap — badged as a driver only when it marks a genuine
              high-gap metabolic acidosis, not a mildly raised gap in an alkalosis */}
          {reading.anionGap != null && (
            <GaugeRow
              title={`Anion gap ${reading.anionGap}${reading.anionGapCorrected != null ? ` (corr. ${reading.anionGapCorrected})` : ''}`}
              role={
                reading.agState === 'high' &&
                (reading.primary === 'metabolic acidosis' || reading.primary === 'mixed disorder' || reading.verdict.includes('metabolic acidosis'))
                  ? 'primary'
                  : 'normal'
              }
            >
              <BandGauge value={reading.anionGapCorrected ?? reading.anionGap} low={8} high={12} domainMin={0} domainMax={28} unit="" />
            </GaugeRow>
          )}

          {/* The stepwise teaching walk */}
          <ol className="space-y-2 pt-1">
            {reading.steps.map((s, i) => (
              <li key={i} className="rounded-lg bg-surface border border-line px-3 py-2">
                <p className="text-xs font-semibold text-brand-700">{s.q}</p>
                <p className="text-sm text-ink leading-relaxed mt-0.5">{s.a}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
