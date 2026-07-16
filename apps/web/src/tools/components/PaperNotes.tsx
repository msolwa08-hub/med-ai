import { useState } from 'react';
import { NotebookPen, FlaskConical, Pill } from 'lucide-react';
import type { WorkingPicture, DiscriminatingFeature } from '../toolsApi';
import { hashFeature } from './ConfirmStream';

// ─── FOR THE PAPER NOTES (M-GLANCE Glance 2) ─────────────────────────────────
// The mainstay is WRITING THE PAPER NOTES. This block is what gets
// transcribed onto the chart: investigations + management as terse, big-type
// lines. Tap a line once it's written — it dims. A reading surface, never a
// form: nothing here is required, nothing gates anything.

const PRIO: Record<'now' | 'today' | 'routine', number> = { now: 0, today: 1, routine: 2 };

function Line({ text, tag, struck, onTap }: { text: string; tag?: string; struck: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={struck}
      className={`w-full flex items-baseline gap-2 text-left rounded-lg px-2 min-h-[44px] py-2 -mx-2 transition-colors hover:bg-surface-alt focus:outline-none focus-visible:shadow-focus ${
        struck ? 'opacity-40' : ''
      }`}
    >
      <span className={`flex-1 text-[17px] leading-snug font-medium text-ink ${struck ? 'line-through decoration-ink-mute' : ''}`}>
        {text}
      </span>
      {tag === 'now' && !struck && (
        <span className="shrink-0 text-2xs font-semibold uppercase tracking-wide text-warn bg-warn/[0.10] rounded-pill px-1.5 py-0.5">now</span>
      )}
    </button>
  );
}

export function PaperNotes({ picture }: { picture: WorkingPicture }) {
  const [struck, setStruck] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setStruck(s => ({ ...s, [k]: !s[k] }));

  const seen = new Set<string>();
  const ix = picture.differentials
    .filter(d => d.confidence >= 25 || d.band === 'must-exclude')
    .flatMap(d => d.discriminators ?? [])
    .filter(d => d.status !== 'done')
    .filter(d => {
      const k = d.test.trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => PRIO[a.priority] - PRIO[b.priority])
    .slice(0, 8);
  const mx = (picture.managementNow ?? []).filter(m => m.trim());
  if (ix.length === 0 && mx.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-surface shadow-card p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-brand-600" aria-hidden />
        <h3 className="text-base font-bold text-ink tracking-tight">For the paper notes</h3>
        <span className="text-xs text-ink-soft">— transcribe, tap what&rsquo;s written</span>
      </div>

      {ix.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-mute mb-1">
            <FlaskConical className="w-3.5 h-3.5" aria-hidden /> Ix
          </p>
          <div>
            {ix.map(d => (
              <Line key={d.test} text={d.test} tag={d.priority} struck={!!struck[`ix:${d.test}`]} onTap={() => toggle(`ix:${d.test}`)} />
            ))}
          </div>
        </div>
      )}

      {mx.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-mute mb-1">
            <Pill className="w-3.5 h-3.5" aria-hidden /> Mx
          </p>
          <div>
            {mx.map(m => (
              <Line key={m} text={m} struck={!!struck[`mx:${m}`]} onTap={() => toggle(`mx:${m}`)} />
            ))}
          </div>
          <p className="text-2xs text-ink-mute mt-1.5 leading-relaxed">
            Doses shown are STG-anchored; confirm anything flagged against the chart before prescribing.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── STILL TO DO — SUGGESTED ─────────────────────────────────────────────────
// Quiet and ignorable by design: the record is never "incomplete", nothing is
// required. Small, muted, zero interaction — just what a consultant might
// still ask about, if the user wants it.

export function StillToDo({ features, answers }: {
  features: DiscriminatingFeature[];
  answers: Record<string, string>;
}) {
  const open = features.filter(f => answers[hashFeature(f.prompt)] === undefined).slice(0, 5);
  if (open.length === 0) return null;
  return (
    <div className="px-1.5">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-mute mb-1">Still to do — suggested</p>
      <ul className="space-y-0.5">
        {open.map(f => (
          <li key={f.prompt} className="text-xs text-ink-mute leading-relaxed flex gap-1.5">
            <span aria-hidden>·</span>
            <span>{f.prompt.replace(/[?.]+$/, '')}{f.kind === 'exam' ? ' (examine)' : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
