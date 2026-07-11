// ─── AnalyteSparkline — the results visual ───────────────────────────────────
// A self-contained, theme-aware SVG that shows a single analyte's story at a
// glance: the shaded REFERENCE BAND, the trend line across dated samples, and
// the latest point coloured by how far out of range it sits. No external chart
// dependency. The neutral band uses the --line CSS var so it flips with the
// theme; the status colours match the design-token band palette.

import type { AnalyteStatus } from '../lib/investigationInsight';

const TONE: Record<string, string> = {
  danger: '#e11d48',   // token: danger / band-exclude
  warn: '#c2740a',     // token: warn / band-possible
  ok: '#0b7a6e',       // token: band-confirmed / positive
  mute: 'rgb(var(--ink-mute))',
};

function toneFor(status: AnalyteStatus): string {
  if (status === 'critical-low' || status === 'critical-high') return TONE.danger;
  if (status === 'high' || status === 'low') return TONE.warn;
  if (status === 'normal') return TONE.ok;
  return TONE.mute;
}

export function AnalyteSparkline({
  points, low, high, status, width = 220, height = 56,
}: {
  points: number[];
  low?: number;
  high?: number;
  status: AnalyteStatus;
  width?: number;
  height?: number;
}) {
  const padX = 6;
  const padY = 8;
  const w = width;
  const h = height;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // Domain spans the data AND the reference band so the band is always visible.
  const candidates = [...points, ...(low !== undefined ? [low] : []), ...(high !== undefined ? [high] : [])];
  let min = Math.min(...candidates);
  let max = Math.max(...candidates);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  const pad = range * 0.12;
  min -= pad; max += pad;

  const x = (i: number) => padX + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => padY + innerH - ((v - min) / (max - min)) * innerH;

  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const tone = toneFor(status);
  const bandTop = high !== undefined ? y(high) : padY;
  const bandBot = low !== undefined ? y(low) : padY + innerH;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      preserveAspectRatio="none"
      role="img"
      aria-label="Trend sparkline with reference band"
      className="block"
    >
      {/* Reference band — the "normal" corridor */}
      {(low !== undefined || high !== undefined) && (
        <rect
          x={0}
          y={Math.min(bandTop, bandBot)}
          width={w}
          height={Math.max(2, Math.abs(bandBot - bandTop))}
          fill="rgb(var(--line-strong) / 0.28)"
        />
      )}
      {/* Band edges */}
      {high !== undefined && <line x1={0} x2={w} y1={bandTop} y2={bandTop} stroke="rgb(var(--line-strong) / 0.7)" strokeWidth={1} strokeDasharray="3 3" />}
      {low !== undefined && <line x1={0} x2={w} y1={bandBot} y2={bandBot} stroke="rgb(var(--line-strong) / 0.7)" strokeWidth={1} strokeDasharray="3 3" />}

      {/* Trend line */}
      {points.length > 1 && (
        <path d={line} fill="none" stroke={tone} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      )}

      {/* Points — earlier ones muted, the latest emphasised in the status tone */}
      {points.map((v, i) => {
        const last = i === points.length - 1;
        return (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={last ? 4 : 2.5}
            fill={last ? tone : 'rgb(var(--surface))'}
            stroke={tone}
            strokeWidth={last ? 0 : 1.5}
          />
        );
      })}
    </svg>
  );
}
