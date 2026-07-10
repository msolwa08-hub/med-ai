import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Presentation as PresentationIcon, ShieldAlert, type LucideIcon } from 'lucide-react';
import { toolsApi, type WardRoundDeltaResponse, type WardRoundUpdate } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { patientContext } from '../lib/patientContext';
import { serializeLatestResults } from '../lib/investigations';
import { AiBtn, Card, copy, stripMarkdown } from '../components/ui';
import { severityIcon } from '../lib/icons';
import { QuickBar } from '../components/QuickBar';
import type { AssistField } from '../toolsApi';

// ─── ROUND & HANDOVER TAB ────────────────────────────────────────────────────
// Deliberately just two outputs — the daily ward-round note and the consultant
// presentation — in large, paper-ready type. Per the ward brief, everything else
// (delta cards, screening lists, saved-round accordions, a second assist panel,
// raw detail dumps) is clutter here; the clerking already captured it. This tab
// exists to produce the two documents the intern actually hands over.
//
// Calm Clinical pass: today's round entry + generate is the primary, always-open
// action surface. The consultant presentation and any medication-safety warnings
// are supporting panels that collapse to a filled one-line summary — a lighter
// local variant of the cockpit's StageCard. An active safety warning always
// forces its panel open the moment it appears.

// A lighter StageCard: same chrome, but the leading marker is a plain icon
// badge (no numbered/checked stage marker) and the panel can carry a safety
// "tone". `outerClassName` lets a caller apply print-visibility toggles.
function Panel({
  icon: Icon, title, summary, tone = 'default', open, onToggle, children, outerClassName = '',
}: {
  icon: LucideIcon;
  title: string;
  summary?: string;
  tone?: 'default' | 'warn' | 'danger';
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  outerClassName?: string;
}) {
  const reduce = useReducedMotion();
  const border = open
    ? tone === 'danger' ? 'border-danger/30 shadow-card-hover' : tone === 'warn' ? 'border-warn/30 shadow-card-hover' : 'border-brand-200 shadow-card-hover'
    : 'border-line shadow-card';
  const badge = tone === 'danger' ? 'bg-danger/10 text-danger' : tone === 'warn' ? 'bg-warn/10 text-warn' : open ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-mute';
  return (
    <section className={`rounded-card border bg-surface transition-shadow ${border} ${outerClassName}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left group focus:outline-none focus-visible:shadow-focus rounded-card"
      >
        <span className={`grid place-items-center w-8 h-8 rounded-full shrink-0 transition-colors ${badge}`}>
          <Icon className="w-4 h-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`text-base font-semibold tracking-tight ${open ? 'text-ink' : 'text-ink-soft'}`}>{title}</span>
          {!open && summary && (
            <span className="block text-sm text-ink-mute truncate mt-0.5">{summary}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-ink-mute transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line/70">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// The single most important surface in the app: the finished note the intern
// reads to the consultant / copies onto the chart. Big type, generous leading,
// clean print. This is the "make the important information bigger" fix.
function HandoverSheet({ title, text, onPrint }: { title: string; text: string; onPrint: () => void }) {
  const clean = stripMarkdown(text);
  return (
    <Card elevation="e1" className="mt-4 overflow-hidden print:shadow-none print:border-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-line print:hidden">
        <span className="text-sm font-semibold text-ink-soft">{title}</span>
        <div className="flex items-center gap-4">
          <button onClick={() => copy(clean)} className="text-sm text-brand-700 hover:text-brand-900 font-medium">Copy</button>
          <button onClick={onPrint} className="text-sm text-ink-soft hover:text-ink font-medium">Print</button>
        </div>
      </div>
      <pre className="text-lg text-ink whitespace-pre-wrap leading-[1.7] px-5 sm:px-7 py-6 font-sans tracking-normal">
        {clean}
      </pre>
    </Card>
  );
}

// Compose the delta engine's structured response into ONE plain-text ward-round
// note. The expected-vs-actual synthesis (the improved "work structure") is kept
// — it is just rendered as a single readable sheet, not a wall of cards.
function composeRound(d: WardRoundDeltaResponse): string {
  const lines: string[] = [];
  lines.push(`DAILY WARD ROUND — ${d.date}`);
  lines.push('');
  if (d.onHistory?.trim()) { lines.push('SUBJECTIVE'); lines.push(d.onHistory.trim()); lines.push(''); }
  if (d.onExamination?.trim()) { lines.push('OBJECTIVE / EXAM'); lines.push(d.onExamination.trim()); lines.push(''); }
  if (d.examsToRepeatToday?.length) {
    lines.push('EXAMS TO REPEAT TODAY');
    d.examsToRepeatToday.forEach(e => lines.push(`• ${e}`));
    lines.push('');
  }
  if (d.suggestedInvestigations?.length) {
    lines.push('INVESTIGATIONS');
    d.suggestedInvestigations.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  }
  if (d.suggestedManagement?.length) {
    lines.push('PLAN');
    d.suggestedManagement.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
    lines.push('');
  }
  if (d.consultantLogicExplanation?.trim()) {
    lines.push('REASONING');
    lines.push(d.consultantLogicExplanation.trim());
  }
  return lines.join('\n').trim();
}

const TODAY_INPUTS: { key: 'todaySubjective' | 'todayObjective' | 'todayVitals' | 'newResults'; label: string; placeholder: string }[] = [
  { key: 'todaySubjective', label: 'Overnight / subjective', placeholder: 'How the night went' },
  { key: 'todayObjective', label: 'On examination today', placeholder: 'What you found this morning' },
  { key: 'todayVitals', label: 'Vitals', placeholder: 'BP, HR, RR, temp, sats' },
  { key: 'newResults', label: 'New results', placeholder: 'Overnight bloods, imaging' },
];

export function RoundTab({ patient, toolsKey, dept, subDept, onLog, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onLog: (note: string) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [today, setToday] = useState({ todaySubjective: '', todayObjective: '', todayVitals: '', newResults: '' });

  const [roundLoading, setRoundLoading] = useState(false);
  const [roundText, setRoundText] = useState('');
  const [roundSafety, setRoundSafety] = useState<WardRoundDeltaResponse['safety']>([]);
  const [roundErr, setRoundErr] = useState('');

  const [presLoading, setPresLoading] = useState(false);
  const [presText, setPresText] = useState('');
  const [presErr, setPresErr] = useState('');

  const [printing, setPrinting] = useState<'round' | 'presentation' | null>(null);
  function printSheet(which: 'round' | 'presentation') {
    setPrinting(which);
    setTimeout(() => { window.print(); setPrinting(null); }, 50);
  }

  // ── Collapsible-panel open state — the presentation and any medication
  // safety warnings are supporting panels that default collapsed. An active
  // safety warning forces its panel open the moment it appears; the
  // presentation panel opens once it has something to show.
  const [openRoundSafety, setOpenRoundSafety] = useState(false);
  const [openPresentation, setOpenPresentation] = useState(false);

  useEffect(() => {
    if ((roundSafety?.length ?? 0) > 0) setOpenRoundSafety(true);
  }, [roundSafety]);

  useEffect(() => {
    if (presText) setOpenPresentation(true);
  }, [presText]);

  async function generateRound() {
    setRoundLoading(true);
    setRoundErr('');
    try {
      const res = await toolsApi.wardRoundDelta(toolsKey, {
        dept,
        subDept,
        patientContext: patientContext(patient, dept, subDept),
        problems: patient.problems
          .map(p => [p.problem, p.workingDx].filter(Boolean).join(' — '))
          .filter(Boolean),
        history: [patient.history.chiefComplaint, patient.history.hpi].filter(Boolean).join(' — ') || undefined,
        generalExam: patient.assessment.generalExam || undefined,
        focusedExam: patient.assessment.examination || undefined,
        medications: patient.history.medications || undefined,
        allergies: patient.intake.allergies || undefined,
        previousRounds: patient.rounds ?? [],
        todaySubjective: today.todaySubjective || undefined,
        todayObjective: today.todayObjective || undefined,
        vitals: today.todayVitals || patient.assessment.vitals || undefined,
        newResults: [serializeLatestResults(patient.investigations ?? []), today.newResults].filter(Boolean).join('. ') || undefined,
        imageFindings: patient.imageFindings?.map(f => `${f.date} ${f.modality.toUpperCase()}: ${f.injectText}`),
      });
      const text = composeRound(res);
      setRoundText(text);
      setRoundSafety(res.safety ?? []);
      // Persist silently so the trajectory feeds the next round — no accordion,
      // just a quiet one-line count.
      const entry: WardRoundUpdate = {
        date: res.date || new Date().toISOString().slice(0, 10),
        onHistory: res.onHistory,
        onExamination: res.onExamination,
        examsToRepeatToday: res.examsToRepeatToday ?? [],
        suggestedInvestigations: res.suggestedInvestigations,
        suggestedManagement: res.suggestedManagement,
        consultantLogicExplanation: res.consultantLogicExplanation,
      };
      onPatient({ rounds: [...(patient.rounds ?? []), entry] });
      onLog(stripMarkdown(text));
    } catch {
      setRoundErr('Could not generate the round — add today’s findings or check the record, then try again.');
    } finally {
      setRoundLoading(false);
    }
  }

  async function generatePresentation() {
    setPresLoading(true);
    setPresErr('');
    try {
      const r = await toolsApi.presentPatient(toolsKey, {
        dept,
        subDept,
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        problems: patient.problems.map(p => ({
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
        })),
      });
      setPresText(`${r.oneLineSummary}\n\n${r.presentation}`);
    } catch {
      setPresErr('Could not generate the presentation — try again in a moment.');
    } finally {
      setPresLoading(false);
    }
  }

  const roundsOnRecord = patient.rounds?.length ?? 0;

  // ── Filled one-line summaries for the collapsed supporting panels ──────────
  const blockCount = (roundSafety ?? []).filter(w => w.severity === 'BLOCK').length;
  const warnCount = (roundSafety ?? []).filter(w => w.severity === 'WARN').length;
  const roundSafetySummary = [blockCount ? `${blockCount} BLOCK` : '', warnCount ? `${warnCount} WARN` : '']
    .filter(Boolean)
    .join(' · ');
  const roundSafetyTone: 'danger' | 'warn' = blockCount > 0 ? 'danger' : 'warn';
  const presentationSummary = presText ? 'Generated · ready to copy or print' : 'Not generated yet';

  return (
    <div className="space-y-6">
      {/* ── Daily Ward Round — the primary, always-open action surface ── */}
      <section className={printing === 'presentation' ? 'print:hidden' : ''}>
        <h2 className="text-2xl font-bold text-ink tracking-tight">Daily Ward Round</h2>
        <p className="text-ink-mute text-sm mt-1 mb-4 print:hidden">
          The note you write on the chart each day. Add today’s findings, generate, copy or print.
        </p>

        {/* Fastest in: dictate/type the whole round in one go → fills the four
            fields below. The fields stay as the review/edit surface. */}
        <div className="mb-3 print:hidden">
          <QuickBar
            toolsKey={toolsKey}
            dept={dept}
            subDept={subDept}
            section="Ward round"
            title="Quick round"
            hint="say or type today’s progress; I’ll sort it"
            cta="Fill round"
            placeholder={'e.g. "slept well, eating and mobilising, no fresh complaints, obs stable BP 128 over 78 HR 76 afebrile sats 98, morning bloods CRP down to 40 Hb steady, plan continue IV antibiotics day 3, step down to oral tomorrow, likely home Friday"'}
            fields={TODAY_INPUTS.map(f => ({ key: f.key, label: f.label, value: today[f.key] })) as AssistField[]}
            context={patientContext(patient, dept, subDept)}
            onResults={u => setToday(prev => ({ ...prev, ...u }))}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 print:hidden">
          {TODAY_INPUTS.map(f => (
            <div key={f.key}>
              <p className="text-sm font-medium text-ink-soft mb-1">{f.label}</p>
              <textarea
                value={today[f.key]}
                onChange={e => setToday(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-base text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-4 print:hidden">
          <AiBtn onClick={generateRound} loading={roundLoading} label="Generate ward round" />
          {roundsOnRecord > 0 && (
            <span className="text-sm text-ink-mute">{roundsOnRecord} previous round{roundsOnRecord === 1 ? '' : 's'} on record</span>
          )}
        </div>
        {roundErr && <p className="text-danger text-sm mt-2 print:hidden">{roundErr}</p>}

        {(roundSafety?.length ?? 0) > 0 && (
          <Panel
            icon={ShieldAlert}
            title="Medication safety"
            summary={roundSafetySummary}
            tone={roundSafetyTone}
            open={openRoundSafety}
            onToggle={() => setOpenRoundSafety(o => !o)}
            outerClassName="mt-4 print:hidden"
          >
            <div className="space-y-2">
              {roundSafety!.map((w, i) => {
                const isBlock = w.severity === 'BLOCK';
                const Icon = severityIcon(isBlock ? 'block' : 'warn');
                return (
                  <div
                    key={i}
                    className={`text-base rounded-xl px-4 py-3 border ${
                      isBlock ? 'bg-danger/[0.08] border-danger/20 text-danger' : 'bg-warn/[0.08] border-warn/20 text-warn'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden /> {w.drug}
                    </span>
                    <span className="text-xs uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
                    <p className="mt-0.5 leading-relaxed">{w.reason}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {roundText && <HandoverSheet title="Ward round note" text={roundText} onPrint={() => printSheet('round')} />}
      </section>

      {/* ── Consultant Presentation — supporting, on-demand panel ── */}
      <Panel
        icon={PresentationIcon}
        title="Consultant Presentation"
        summary={presentationSummary}
        open={openPresentation}
        onToggle={() => setOpenPresentation(o => !o)}
        outerClassName={printing === 'round' ? 'print:hidden' : ''}
      >
        <p className="text-ink-mute text-sm mb-4 print:hidden">
          The spoken SBAR hand-over you present on the round. Generates from the record — usable at any point.
        </p>
        <div className="flex items-center gap-3 print:hidden">
          <AiBtn onClick={generatePresentation} loading={presLoading} label="Generate presentation" />
        </div>
        {presErr && <p className="text-danger text-sm mt-2 print:hidden">{presErr}</p>}
        {presText && <HandoverSheet title="Consultant presentation" text={presText} onPrint={() => printSheet('presentation')} />}
      </Panel>
    </div>
  );
}
