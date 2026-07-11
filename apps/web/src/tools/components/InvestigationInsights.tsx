import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, FlaskConical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PANELS, ALL_ANALYTES, type AnalyteTrend } from '../lib/investigations';
import { insightFor, statusTone } from '../lib/investigationInsight';
import { panelIcon } from '../lib/icons';
import { AnalyteSparkline } from './AnalyteSparkline';
import { SectionHead } from './ui';

// ─── INVESTIGATION INSIGHTS — the clustered visual learning aid ───────────────
// Groups the trended results by system (renal / FBC / inflammatory / cardiac /
// …), and for each analyte shows the story visually — the sparkline against its
// reference band, the status, the delta — with a teach-while-you-work reading of
// WHAT it means and WHY it moves the picture. This is the learning tool: an
// intern sees not just "K 6.2 ↑" but what that means and what to do about it.

// analyte key → its owning panel (id + label), for grouping.
const KEY_PANEL: Record<string, { id: string; label: string }> = Object.fromEntries(
  PANELS.flatMap(p => p.analytes.map(a => [a.key, { id: p.id, label: p.label }])),
);

const TONE_CHIP: Record<string, string> = {
  danger: 'text-danger bg-danger/[0.10] border-danger/25',
  warn: 'text-warn bg-warn/[0.10] border-warn/25',
  ok: 'text-band-confirmed bg-band-confirmed/[0.10] border-band-confirmed/25',
  mute: 'text-ink-mute bg-surface-alt border-line',
};
const TONE_TEXT: Record<string, string> = {
  danger: 'text-danger', warn: 'text-warn', ok: 'text-ink', mute: 'text-ink-soft',
};

function InsightRow({ trend }: { trend: AnalyteTrend }) {
  const [open, setOpen] = useState(false);
  const analyte = ALL_ANALYTES[trend.key];
  const insight = insightFor(trend, analyte);
  const tone = statusTone(insight.status);
  const Arrow = !trend.previous ? Minus : trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;

  return (
    <div className="rounded-lg border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3.5 py-3 flex items-center gap-3 hover:bg-surface-alt/60 transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink truncate">{analyte?.label ?? trend.label}</span>
            {insight.statusLabel !== '—' && (
              <span className={`shrink-0 text-2xs font-semibold uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${TONE_CHIP[tone]}`}>
                {insight.statusLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-soft leading-snug mt-0.5 line-clamp-1">{insight.meaning}</p>
        </div>
        <div className="shrink-0 w-[120px] hidden sm:block">
          <AnalyteSparkline
            points={trend.points.map(p => p.value)}
            low={analyte?.low}
            high={analyte?.high}
            status={insight.status}
            width={120}
            height={40}
          />
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-md font-bold tabular-nums ${TONE_TEXT[tone]}`}>{trend.latest.raw}</div>
          <div className="flex items-center justify-end gap-0.5 text-2xs text-ink-mute">
            <Arrow className="w-3 h-3" aria-hidden />
            {analyte?.unit}
          </div>
        </div>
        <ChevronDown className={`shrink-0 w-4 h-4 text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 pt-0 space-y-2.5">
          {/* On phones the sparkline moves inline here (hidden in the row above) */}
          <div className="sm:hidden">
            <AnalyteSparkline
              points={trend.points.map(p => p.value)}
              low={analyte?.low}
              high={analyte?.high}
              status={insight.status}
              width={280}
              height={48}
            />
          </div>
          <div className="flex items-center justify-between text-2xs text-ink-mute">
            <span>{trend.points.map(p => p.raw).join('  →  ')}</span>
            {(analyte?.low !== undefined || analyte?.high !== undefined) && (
              <span className="tabular-nums">ref {analyte?.low ?? ''}{analyte?.low !== undefined && analyte?.high !== undefined ? '–' : ''}{analyte?.high ?? ''} {analyte?.unit}</span>
            )}
          </div>
          <div className="rounded-lg bg-surface-alt border border-line px-3 py-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700 mb-1">What it means &amp; why</p>
            <p className="text-sm text-ink leading-relaxed">{insight.why}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function InvestigationInsights({ trends }: { trends: AnalyteTrend[] }) {
  if (trends.length === 0) return null;

  // Cluster by owning panel, in PANELS order, so related tests read together.
  const groups: { id: string; label: string; Icon: LucideIcon; rows: AnalyteTrend[] }[] = [];
  for (const p of PANELS) {
    const rows = trends.filter(t => KEY_PANEL[t.key]?.id === p.id);
    if (rows.length) groups.push({ id: p.id, label: p.label, Icon: panelIcon(p.id), rows });
  }
  const grouped = new Set(groups.flatMap(g => g.rows.map(r => r.key)));
  const ungrouped = trends.filter(t => !grouped.has(t.key));
  if (ungrouped.length) groups.push({ id: 'other', label: 'Other', Icon: FlaskConical, rows: ungrouped });

  return (
    <div className="space-y-4">
      <SectionHead>Results — what they mean</SectionHead>
      {groups.map(g => (
        <div key={g.id} className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <g.Icon className="w-3.5 h-3.5 text-brand-600" aria-hidden />
            {g.label}
          </div>
          <div className="space-y-1.5">
            {g.rows.map(t => <InsightRow key={t.key} trend={t} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
