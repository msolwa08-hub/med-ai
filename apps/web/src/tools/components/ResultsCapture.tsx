import { useMemo, useState } from 'react';
import type { Patient } from '../fields/types';
import {
  panelsFor,
  analyteTrends,
  trendAlerts,
  type InvestigationEntry,
} from '../lib/investigations';
import { SectionHead } from './ui';
import { WhyButton } from './WhyButton';
import { EscapeHatch } from './EscapeHatch';
import { SystemsMap } from './SystemsMap';
import { panelIcon } from '../lib/icons';

// ─── RESULTS CAPTURE — the loop's second input ───────────────────────────────
// Panel-based capture, per-analyte trending and the deterministic one-step-ahead
// alerts. Lives INSIDE the bedside capture stream (results are input to the
// picture, same as findings) — extracted from the old Results tab so the whole
// loop happens on one canvas.

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ResultsCapture({ patient, dept, onPatient }: {
  patient: Patient;
  dept: string;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const entries = patient.investigations ?? [];
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState('');

  const trends = useMemo(() => analyteTrends(entries), [entries]);
  const alerts = useMemo(() => trendAlerts(trends), [trends]);

  function savePanel(panelId: string) {
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(draft)) if (v.trim()) values[k] = v.trim();
    if (Object.keys(values).length === 0) { setOpenPanel(null); return; }
    const entry: InvestigationEntry = { date, panel: panelId, values };
    onPatient({ investigations: [...entries, entry] });
    setDraft({});
    setOpenPanel(null);
  }

  return (
    <div className="space-y-5">
      {/* One-step-ahead alerts — the app thinking slightly ahead of the intern */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <SectionHead>Watch these</SectionHead>
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-xl border px-4 py-2.5 ${
                a.severity === 'red'
                  ? 'bg-danger/[0.08] border-danger/25 text-danger'
                  : 'bg-warn/[0.08] border-warn/25 text-warn'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${a.severity === 'red' ? 'bg-band-exclude' : 'bg-band-possible'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{a.message}</p>
                </div>
                <WhyButton why={a.why} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* See what's wrong with the body — the organ-system schematic lights up
          from the entered results + the working diagnosis, with the interpretation beside it. */}
      <SystemsMap trends={trends} picture={patient.workingPicture} />

      {/* Capture — pick a panel, enter a dated set of values */}
      <div>
        <SectionHead>Add results</SectionHead>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-ink-mute">Date</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-surface border border-line-strong rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {panelsFor(dept).map(panel => {
            const PIcon = panelIcon(panel.id);
            return (
            <div key={panel.id} className="rounded-card border border-line overflow-hidden">
              <button
                onClick={() => { setOpenPanel(openPanel === panel.id ? null : panel.id); setDraft({}); }}
                className={`w-full min-h-[52px] px-4 py-3 text-left flex items-center gap-2.5 transition-colors ${
                  openPanel === panel.id ? 'bg-brand-50' : 'bg-surface hover:bg-surface-alt'
                }`}
              >
                <PIcon className="w-4 h-4 text-brand-600 shrink-0" aria-hidden />
                <span className="text-sm font-medium text-ink">{panel.label}</span>
                <span className="ml-auto text-ink-mute">{openPanel === panel.id ? '−' : '+'}</span>
              </button>
              {openPanel === panel.id && (
                <div className="px-4 py-3 border-t border-line bg-surface-alt/50 space-y-2">
                  {panel.analytes.map(a => (
                    <div key={a.key} className="flex items-center gap-2">
                      <label className="text-xs text-ink-soft w-24 shrink-0">{a.label}</label>
                      <input
                        value={draft[a.key] ?? ''}
                        onChange={e => setDraft(prev => ({ ...prev, [a.key]: e.target.value }))}
                        placeholder={a.unit}
                        inputMode="decimal"
                        className="flex-1 bg-surface border border-line rounded-lg px-2.5 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      {(a.low !== undefined || a.high !== undefined) && (
                        <span className="text-[10px] text-ink-mute w-20 shrink-0">
                          {a.low ?? ''}{a.low !== undefined && a.high !== undefined ? '–' : ''}{a.high ?? ''}
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => savePanel(panel.id)}
                    className="mt-1 min-h-[40px] px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
                  >
                    Save {panel.label}
                  </button>
                </div>
              )}
            </div>
          );
          })}
        </div>
      </div>

      {entries.length === 0 && alerts.length === 0 && (
        <p className="text-sm text-ink-mute text-center py-4">No results yet.</p>
      )}

      <EscapeHatch
        value={freeText}
        onChange={setFreeText}
        placeholder="Other result (special stain, culture, histology, hormone assay…) — saved with today's date"
      />
      {freeText.trim() && (
        <button
          onClick={() => {
            onPatient({ investigations: [...entries, { date, panel: 'other', values: {}, note: freeText.trim() }] });
            setFreeText('');
          }}
          className="min-h-[40px] px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium"
        >
          Save note
        </button>
      )}
    </div>
  );
}

/** Compact facts for stage summaries: entry count + red/amber alert count. */
export function resultsSummary(patient: Patient): string {
  const entries = patient.investigations ?? [];
  if (entries.length === 0) return 'No results yet';
  const alerts = trendAlerts(analyteTrends(entries));
  const reds = alerts.filter(a => a.severity === 'red').length;
  const alertBit = alerts.length > 0 ? ` · ${alerts.length} alert${alerts.length > 1 ? 's' : ''}${reds ? ` (${reds} red)` : ''}` : '';
  return `${entries.length} result set${entries.length > 1 ? 's' : ''}${alertBit}`;
}
