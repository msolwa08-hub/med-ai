import { useEffect, useRef } from 'react';
import { MessageCircleQuestion, ShieldAlert, Stethoscope, Eye } from 'lucide-react';
import type { DeptId } from '../config/departments';
import type { SymptomCascade } from '../config/symptomCascades';
import { examChecklistFor } from '../config/examChecklists';
import { mustNotMissFor } from '../config/briefings';
import { findingStem } from './ExamCapture';

// ─── GLANCE 1 — the pre-encounter briefing (M-GLANCE) ────────────────────────
// ≤10 seconds, 390px, zero required interaction: what history to take, what
// not to miss, where the exam focuses — then the phone goes away and the
// encounter is real medicine on paper. Deterministic local content (cascades,
// checklists, briefing registry): no model latency inside a 10s glance.

export function briefingAvailable(cascade: SymptomCascade | undefined, dept: DeptId): boolean {
  return !!cascade && mustNotMissFor(cascade.id, dept).length > 0;
}

// A TYPED complaint is as good as a tapped chip: match free text to a cascade
// so the briefing never depends on the user finding the right button.
const COMPLAINT_ALIASES: Record<string, RegExp> = {
  'chest-pain': /chest (pain|tight|discomfort)|angina/i,
  sob: /short(ness)? of breath|dyspn|\bsob\b|difficulty breathing|can'?t breathe/i,
  'abdo-pain': /abdo|stomach (pain|ache)|belly|epigastr|tummy/i,
  headache: /headache|head ache|head pain/i,
  fever: /fever|febrile|pyrexi|high temp/i,
  trauma: /trauma|injur|accident|\bMVA\b|\bPVA\b|assault|stab|shot|fell|fall\b/i,
  'pv-bleeding': /pv bleed|vaginal bleed|bleeding pv|bleeding per vagina/i,
  'reduced-loc': /reduced (loc|level)|unconscious|unresponsive|drowsy|confus|not waking/i,
  seizure: /seizure|convuls|fitting|\bfits?\b|epilep/i,
  'joint-limb-pain': /joint pain|limb pain|leg pain|arm pain|knee|hip pain|shoulder pain|swollen joint/i,
  cough: /cough|coughing/i,
  'vomiting-diarrhoea': /vomit|diarrh|gastro\b|loose stool/i,
  'psych-presentation': /psych|halluc|suicid|self-?harm|aggress|psychosis|behaviou?r/i,
};

export function cascadeForComplaint(text: string, cascades: SymptomCascade[]): SymptomCascade | undefined {
  const t = text.trim();
  if (!t) return undefined;
  return (
    cascades.find(c => c.label.toLowerCase() === t.toLowerCase()) ??
    cascades.find(c => COMPLAINT_ALIASES[c.id]?.test(t)) ??
    cascades.find(c => t.toLowerCase().includes(c.label.toLowerCase()))
  );
}

function Cluster({ icon: Icon, title, items, tone }: {
  icon: typeof Eye;
  title: string;
  items: string[];
  tone?: 'danger';
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider mb-1 ${tone === 'danger' ? 'text-warn' : 'text-ink-mute'}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden /> {title}
      </p>
      <ul className="space-y-0.5">
        {items.map(x => (
          <li key={x} className={`text-[13px] leading-snug flex gap-1.5 ${tone === 'danger' ? 'text-ink font-medium' : 'text-ink-soft'}`}>
            <span className="text-ink-mute" aria-hidden>·</span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Glance1Briefing({ cascade, dept, subDept, isFemale }: {
  cascade: SymptomCascade;
  dept: DeptId;
  subDept?: string;
  isFemale: boolean;
}) {
  // ASK — the top-level cascade questions ARE the history to take.
  const ask = cascade.blocks
    .filter(b => !b.femaleOnly || isFemale)
    .map(b => b.question.replace(/\?+$/, ''))
    .slice(0, 6);

  const dontMiss = mustNotMissFor(cascade.id, dept);

  // EXAM — the presentation-adaptive + department checklist targets.
  const sections = examChecklistFor(dept, subDept, cascade.label);
  const exam = sections
    .filter(s => s.id !== 'vitals')
    .flatMap(s => s.items)
    .map(i => findingStem(i.label))
    .slice(0, 5);

  // The tap that chose the complaint should land the reader HERE — gently.
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <div ref={ref} className="rounded-card border border-brand-200 bg-surface shadow-card p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-brand-600" aria-hidden />
        <h3 className="text-base font-bold text-ink tracking-tight">Before you go in</h3>
        <span className="text-xs text-ink-soft">— 10 seconds, then the phone goes away</span>
      </div>
      <Cluster icon={MessageCircleQuestion} title="Ask" items={ask} />
      <Cluster icon={ShieldAlert} title="Don't miss" items={dontMiss} tone="danger" />
      <Cluster icon={Stethoscope} title={`Exam${exam.length ? ' — plus full vitals' : ''}`} items={exam} />
    </div>
  );
}
