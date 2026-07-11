import { Activity } from 'lucide-react';
import type { AnalyteTrend } from '../lib/investigations';
import type { WorkingPicture } from '../toolsApi';
import { buildSystemsMap, SEVERITY_HEX, type SystemId, type Severity, type SystemState } from '../lib/systemsMap';
import { WhyButton } from './WhyButton';

// ─── SYSTEMS MAP — the organ-system schematic ("see what's wrong with the body") ─
// A tidy, loosely body-arranged diagram of the organ systems. Each node lights up
// and tints by severity when the patient's OWN data implicates it, edges connect
// the systems that are both flagged (the relationship the intern should notice),
// and a suspicion ring marks systems the leading differential points at. Beside
// it, the interpretation in words. Self-contained, theme-aware (neutrals via CSS
// vars, status via the band palette). Pure client render — no API, no doses.

const CHIP: Record<Severity, string> = {
  red: 'bg-danger/[0.12] text-danger border-danger/30',
  amber: 'bg-warn/[0.12] text-warn border-warn/30',
  watch: 'bg-brand-50 text-brand-700 border-brand-200',
  none: 'bg-surface-alt text-ink-mute border-line',
};
const SEV_LABEL: Record<Severity, string> = { red: 'critical', amber: 'deranged', watch: 'suspected', none: '' };

function Node({ s }: { s: SystemState }) {
  const hex = SEVERITY_HEX[s.severity];
  const top = (s.y / 120) * 100;
  const watchOnly = s.severity === 'watch';
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${s.x}%`, top: `${top}%` }}
    >
      <div
        className={`rounded-xl border-2 px-2.5 py-1.5 text-[11px] font-bold leading-none tracking-tight text-center transition-all ${s.active ? 'shadow-sm' : 'opacity-45'}`}
        style={
          s.active
            ? { borderColor: hex, color: hex, backgroundColor: `${hex}1f`, borderStyle: watchOnly ? 'dashed' : 'solid' }
            : undefined
        }
      >
        <span className={s.active ? '' : 'text-ink-mute'}>{s.short}</span>
      </div>
    </div>
  );
}

export function SystemsMap({ trends, picture }: { trends: AnalyteTrend[]; picture?: WorkingPicture }) {
  const model = buildSystemsMap(trends, picture);
  const byId = Object.fromEntries(model.systems.map(s => [s.id, s])) as Record<SystemId, SystemState>;
  const activeSystems = model.systems.filter(s => s.active).sort((a, b) =>
    ({ red: 3, amber: 2, watch: 1, none: 0 }[b.severity] - { red: 3, amber: 2, watch: 1, none: 0 }[a.severity]));

  return (
    <div className="rounded-card border border-brand-100 bg-surface-brand p-4 shadow-card space-y-3">
      <div className="flex items-start gap-2.5">
        <Activity className="w-4 h-4 shrink-0 mt-0.5 text-brand-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700">Body systems</p>
          <p className="text-sm font-bold text-ink leading-snug">
            {model.anyActive
              ? `${activeSystems.length} system${activeSystems.length > 1 ? 's' : ''} flagged — see what the results point to`
              : 'Nothing flagged yet — results normal so far'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,260px)_1fr] gap-4 items-start">
        {/* The schematic */}
        <div className="relative w-full mx-auto max-w-[280px]" style={{ aspectRatio: '100 / 120' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden>
            {model.edges.map((e, i) => {
              const A = byId[e.a], B = byId[e.b];
              return (
                <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={SEVERITY_HEX[e.severity]} strokeWidth={0.7} strokeOpacity={0.55} strokeDasharray="2.5 1.8" />
              );
            })}
          </svg>
          {model.systems.map(s => <Node key={s.id} s={s} />)}
        </div>

        {/* The interpretation, beside it */}
        <div className="space-y-2">
          {activeSystems.length === 0 && (
            <p className="text-sm text-ink-mute py-6 text-center lg:text-left">
              Add results and the systems they belong to light up here — with what's deranged and how they relate.
            </p>
          )}
          {activeSystems.map(s => {
            const why = s.drivers.map(d => `${d.label} ${d.value} — ${d.meaning}\n${d.why}`).join('\n\n')
              || (s.dxImplicated.length ? `Suspected from the differential: ${s.dxImplicated.join(', ')}.` : '');
            return (
              <div key={s.id} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink">{s.label}</span>
                  {s.severity !== 'none' && (
                    <span className={`text-2xs font-semibold uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${CHIP[s.severity]}`}>
                      {SEV_LABEL[s.severity]}
                    </span>
                  )}
                  {why && <span className="ml-auto"><WhyButton why={why} /></span>}
                </div>
                {s.drivers.length > 0 ? (
                  <p className="text-xs text-ink-soft leading-snug mt-1">
                    {s.drivers.map(d => `${d.label} ${d.value}`).join(' · ')}
                    <span className="text-ink-mute"> — {s.drivers[0].meaning}</span>
                  </p>
                ) : (
                  <p className="text-xs text-ink-soft leading-snug mt-1">
                    Suspected from the working diagnosis ({s.dxImplicated.join(', ')}) — no abnormal result yet.
                  </p>
                )}
              </div>
            );
          })}
          {model.edges.length > 0 && (
            <p className="text-2xs text-ink-mute leading-snug pt-0.5">
              Linked systems (both flagged): {model.edges.map(e => `${byId[e.a].short}↔${byId[e.b].short}`).join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
