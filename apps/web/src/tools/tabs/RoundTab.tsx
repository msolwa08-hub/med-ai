import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown, Presentation as PresentationIcon, ShieldAlert,
  History, ClipboardList, Ban, AlertTriangle, Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { toolsApi, type WardRoundDeltaResponse, type WardRoundUpdate } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { patientContext } from '../lib/patientContext';
import { serializeLatestResults } from '../lib/investigations';
import { AiBtn, Card, copy, stripMarkdown } from '../components/ui';
import { QuickBar } from '../components/QuickBar';
import type { AssistField } from '../toolsApi';
import { VITAL_META } from '../components/ExamCapture';

// ─── WARD ROUND TAB ────────────────────────────────────────────────────────
// The intern's daily ward round surface. Designed for MINIMAL INPUT →
// MAXIMUM INTERPRETATION: the patient's current state is auto-populated from
// the clerking record, the intern only adds what changed overnight, and the
// AI synthesizes a complete ward round note with clinical reasoning, trend
// analysis, and proactive recommendations.
//
// Structure:
// 1. Patient context card — what the AI knows (auto-populated, read-only)
// 2. Today's progress — 2 inputs (overnight + findings) with voice/QuickBar
// 3. Generate → EDITABLE ward round note
// 4. Collapsible: safety alerts, progress log, consultant presentation

// ── Collapsible panel (local StageCard variant) ─────────────────────────────
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

// ── Editable handover sheet — the note the intern copies onto the chart ────
function HandoverSheet({ title, text, onChange, onPrint }: {
  title: string;
  text: string;
  onChange: (v: string) => void;
  onPrint: () => void;
}) {
  return (
    <Card elevation="e1" className="mt-4 overflow-hidden print:shadow-none print:border-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-line print:hidden">
        <span className="text-sm font-semibold text-ink-soft">{title}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => copy(stripMarkdown(text))} aria-label="Copy note" className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] px-3">Copy</button>
          <button onClick={onPrint} aria-label="Print note" className="text-sm text-ink-soft hover:text-ink font-medium min-h-[44px] px-3">Print</button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        rows={Math.max(12, text.split('\n').length + 2)}
        className="w-full text-base text-ink whitespace-pre-wrap leading-[1.7] px-5 sm:px-7 py-6 font-sans tracking-normal bg-transparent resize-none focus:outline-none print:border-0"
      />
    </Card>
  );
}

// ── Compose the delta response into a single plain-text ward-round note ────
function composeRound(d: WardRoundDeltaResponse): string {
  const lines: string[] = [];
  lines.push(`DAILY WARD ROUND — ${d.date}`);
  lines.push('');
  if (d.onHistory?.trim()) { lines.push('SUBJECTIVE'); lines.push(d.onHistory.trim()); lines.push(''); }
  if (d.onExamination?.trim()) { lines.push('OBJECTIVE / EXAMINATION'); lines.push(d.onExamination.trim()); lines.push(''); }
  if (d.examsToRepeatToday?.length) {
    lines.push('REPEAT EXAMINATIONS');
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
    lines.push('CLINICAL REASONING');
    lines.push(d.consultantLogicExplanation.trim());
  }
  return lines.join('\n').trim();
}

// ── Auto-extract vitals from the exam checklist capture ────────────────────
function extractVitals(patient: Patient): string {
  const vals = patient.examChecklist?.values;
  if (!vals) return patient.assessment.vitals || '';
  const parts: string[] = [];
  for (const [id, meta] of Object.entries(VITAL_META)) {
    const v = vals[id]?.trim();
    if (v) parts.push(`${meta.label} ${v}`);
  }
  return parts.length > 0 ? parts.join(', ') : patient.assessment.vitals || '';
}

// ── Compute day of admission ───────────────────────────────────────────────
function dayOfAdmission(admissionDate: string | undefined): string {
  if (!admissionDate) return '';
  const admit = new Date(admissionDate);
  if (isNaN(admit.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - admit.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Day 0 (admission day)';
  if (days === 1) return 'Day 1';
  return `Day ${days}`;
}

const TODAY_INPUTS: { key: 'todaySubjective' | 'todayObjective'; label: string; placeholder: string; rows: number }[] = [
  { key: 'todaySubjective', label: 'Overnight / subjective', placeholder: 'How the patient reports the night — sleep, pain, appetite, bowel function, mobility, new complaints', rows: 3 },
  { key: 'todayObjective', label: 'On examination today', placeholder: 'Today\'s examination findings, vitals, and new results — or leave blank to auto-populate from the record', rows: 3 },
];

export function RoundTab({ patient, toolsKey, dept, subDept, onLog, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onLog: (note: string) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [today, setToday] = useState({ todaySubjective: '', todayObjective: '' });

  const [roundLoading, setRoundLoading] = useState(false);
  const [roundText, setRoundText] = useState('');
  const [roundSafety, setRoundSafety] = useState<WardRoundDeltaResponse['safety']>([]);
  const [roundErr, setRoundErr] = useState('');

  const [presLoading, setPresLoading] = useState(false);
  const [presText, setPresText] = useState('');
  const [presErr, setPresErr] = useState('');

  const [printing, setPrinting] = useState<'round' | 'presentation' | null>(null);
  const [openProgress, setOpenProgress] = useState(false);
  const [openRoundSafety, setOpenRoundSafety] = useState(false);
  const [openPresentation, setOpenPresentation] = useState(false);

  useEffect(() => {
    if ((roundSafety?.length ?? 0) > 0) setOpenRoundSafety(true);
  }, [roundSafety]);

  useEffect(() => {
    if (presText) setOpenPresentation(true);
  }, [presText]);

  // ── Auto-populated context for the AI ──────────────────────────────────
  const currentVitals = useMemo(() => extractVitals(patient), [patient.examChecklist?.values, patient.assessment.vitals]);
  const latestResults = useMemo(() => serializeLatestResults(patient.investigations ?? []), [patient.investigations]);
  const admissionDay = useMemo(() => dayOfAdmission(patient.intake.admissionDate), [patient.intake.admissionDate]);
  const activeProblems = patient.problems.filter(p => p.status === 'active' || p.status === 'resolving');
  const roundsOnRecord = patient.rounds?.length ?? 0;
  const progressLog = patient.progressLog ?? [];

  function printSheet(which: 'round' | 'presentation') {
    setPrinting(which);
    setTimeout(() => { window.print(); setPrinting(null); }, 50);
  }

  async function generateRound() {
    setRoundLoading(true);
    setRoundErr('');
    try {
      const objectiveData = [
        today.todayObjective,
        !today.todayObjective && currentVitals ? `Vitals: ${currentVitals}` : '',
      ].filter(Boolean).join('. ');

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
        todayObjective: objectiveData || undefined,
        vitals: currentVitals || undefined,
        newResults: [latestResults, today.todayObjective].filter(Boolean).join('. ') || undefined,
        imageFindings: patient.imageFindings?.map(f => `${f.date} ${f.modality.toUpperCase()}: ${f.injectText}`),
      });
      const text = composeRound(res);
      setRoundText(text);
      setRoundSafety(res.safety ?? []);
      const entryDate = res.date || new Date().toISOString().slice(0, 10);
      const prevRounds = patient.rounds ?? [];
      const lastRound = prevRounds[prevRounds.length - 1];
      if (lastRound && lastRound.date === entryDate && lastRound.onHistory === res.onHistory) {
        return;
      }
      const entry: WardRoundUpdate = {
        date: entryDate,
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
      setRoundErr('Could not reach the engine — tap to retry.');
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
      setPresErr('Could not generate — try again in a moment.');
    } finally {
      setPresLoading(false);
    }
  }

  const blockCount = (roundSafety ?? []).filter(w => w.severity === 'BLOCK').length;
  const warnCount = (roundSafety ?? []).filter(w => w.severity === 'WARN').length;
  const roundSafetySummary = [blockCount ? `${blockCount} BLOCK` : '', warnCount ? `${warnCount} WARN` : '']
    .filter(Boolean).join(' · ');
  const roundSafetyTone: 'danger' | 'warn' = blockCount > 0 ? 'danger' : 'warn';
  const presentationSummary = presText ? 'Generated — ready to copy or print' : 'Not yet generated';

  const progressLogText = progressLog
    .map(e => `${e.date}\n${stripMarkdown(e.note)}`)
    .join('\n\n────────────\n\n');

  return (
    <div className="space-y-5">
      {/* ── Patient context — what the AI knows, at a glance ── */}
      <Card elevation="flat" className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Patient context for this round</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {patient.intake.name && (
            <ContextRow label="Patient" value={[patient.intake.name, patient.intake.age, patient.intake.sex].filter(Boolean).join(', ')} />
          )}
          {admissionDay && (
            <ContextRow label="Admission" value={`${admissionDay}${patient.intake.admissionDiagnosis ? ` — ${patient.intake.admissionDiagnosis}` : ''}`} />
          )}
          {activeProblems.length > 0 && (
            <ContextRow
              label={`Active problems (${activeProblems.length})`}
              value={activeProblems.map(p => p.workingDx || p.problem).join('; ')}
              span
            />
          )}
          {patient.history.medications && (
            <ContextRow label="Current medications" value={patient.history.medications} span />
          )}
          {patient.intake.allergies && (
            <ContextRow label="Allergies" value={patient.intake.allergies} highlight />
          )}
          {currentVitals && (
            <ContextRow label="Latest vitals" value={currentVitals} span />
          )}
          {latestResults && (
            <ContextRow label="Latest results" value={latestResults} span />
          )}
          {roundsOnRecord > 0 && (
            <ContextRow label="Previous rounds" value={`${roundsOnRecord} on record`} />
          )}
        </div>
        {!patient.intake.name && !activeProblems.length && !currentVitals && (
          <p className="text-sm text-ink-mute mt-1">
            Complete the bedside clerking first — the round builds on that record.
          </p>
        )}
      </Card>

      {/* ── Daily Ward Round — today's progress ── */}
      <section className={printing === 'presentation' ? 'print:hidden' : ''}>
        <h2 className="text-2xl font-bold text-ink tracking-tight">Daily Ward Round</h2>
        <p className="text-ink-mute text-sm mt-1 mb-4 print:hidden">
          Add today's subjective and objective findings. The AI synthesizes a complete ward round note with clinical reasoning and trend analysis.
        </p>

        <div className="mb-3 print:hidden">
          <QuickBar
            toolsKey={toolsKey}
            dept={dept}
            subDept={subDept}
            section="Ward round"
            title="Quick round"
            hint="dictate or type today's progress"
            cta="Sort into fields"
            placeholder={'e.g. "slept well, eating and mobilising, no fresh complaints, obs stable BP 128/78 HR 76 afebrile sats 98, morning bloods CRP down to 40 Hb steady, plan continue IV abx day 3, step down oral tomorrow"'}
            fields={TODAY_INPUTS.map(f => ({ key: f.key, label: f.label, value: today[f.key] })) as AssistField[]}
            context={patientContext(patient, dept, subDept)}
            onResults={u => setToday(prev => ({ ...prev, ...u }))}
          />
        </div>

        <div className="space-y-3 print:hidden">
          {TODAY_INPUTS.map(f => (
            <div key={f.key}>
              <p className="text-sm font-medium text-ink-soft mb-1">{f.label}</p>
              <textarea
                value={today[f.key]}
                onChange={e => setToday(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={f.rows}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-base text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-4 print:hidden">
          <AiBtn onClick={generateRound} loading={roundLoading} label="Generate ward round" />
          {roundsOnRecord > 0 && (
            <span className="text-sm text-ink-mute">{roundsOnRecord} previous round{roundsOnRecord === 1 ? '' : 's'} on record — trends included</span>
          )}
        </div>
        {roundErr && <p className="text-danger text-sm mt-2 print:hidden">{roundErr}</p>}

        {roundLoading && !roundText && (
          <div className="mt-4 space-y-3 print:hidden" aria-hidden>
            <div className="rounded-card border border-line bg-surface p-5 space-y-3">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
            <div className="rounded-card border border-line bg-surface p-5 space-y-3">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
            <div className="rounded-card border border-line bg-surface p-5 space-y-3">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="space-y-2">
                {[0, 1, 2].map(i => <div key={i} className="skeleton h-3 w-full rounded" />)}
              </div>
            </div>
          </div>
        )}

        {/* Safety alerts — auto-opens when present */}
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
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-xl px-4 py-3 border-2 ${
                      isBlock
                        ? 'bg-danger/[0.06] border-danger/40 text-danger'
                        : 'bg-warn/[0.06] border-warn/30 text-warn'
                    }`}
                  >
                    <div className={`shrink-0 mt-0.5 grid place-items-center w-7 h-7 rounded-full ${
                      isBlock ? 'bg-danger/15' : 'bg-warn/15'
                    }`}>
                      {isBlock ? <Ban className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-base font-bold ${isBlock ? 'text-danger' : 'text-warn'}`}>
                          {isBlock ? 'STOP' : 'CAUTION'} — {w.drug}
                        </span>
                        <span className="text-xs uppercase tracking-wide opacity-50">{w.category}</span>
                      </div>
                      <p className={`mt-1 text-sm leading-relaxed ${isBlock ? 'text-danger/90' : 'text-warn/90'}`}>{w.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Generated note — EDITABLE so the intern can adjust before copying */}
        {roundText && (
          <HandoverSheet
            title="Ward round note — edit before copying"
            text={roundText}
            onChange={setRoundText}
            onPrint={() => printSheet('round')}
          />
        )}
      </section>

      {/* ── Progress log — the running day-by-day story ── */}
      {progressLog.length > 0 && (
        <Panel
          icon={History}
          title="Progress log"
          summary={`${progressLog.length} dated entr${progressLog.length === 1 ? 'y' : 'ies'}`}
          open={openProgress}
          onToggle={() => setOpenProgress(o => !o)}
          outerClassName={printing === 'presentation' ? 'print:hidden' : ''}
        >
          <div className="flex justify-end mb-2 print:hidden">
            <button onClick={() => copy(progressLogText)} aria-label="Copy all progress notes" className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] px-3">
              Copy all
            </button>
          </div>
          <div className="space-y-3">
            {[...progressLog].reverse().map((e, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className="text-2xs font-semibold uppercase tracking-wide text-brand-700 mb-1">{e.date}</p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">{stripMarkdown(e.note)}</pre>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Consultant Presentation — on-demand ── */}
      <Panel
        icon={PresentationIcon}
        title="Consultant Presentation"
        summary={presentationSummary}
        open={openPresentation}
        onToggle={() => setOpenPresentation(o => !o)}
        outerClassName={printing === 'round' ? 'print:hidden' : ''}
      >
        <p className="text-ink-mute text-sm mb-4 print:hidden">
          Structured SBAR hand-over for the consultant round. Generates from the complete record.
        </p>
        <div className="flex items-center gap-3 print:hidden">
          <AiBtn onClick={generatePresentation} loading={presLoading} label="Generate presentation" />
        </div>
        {presErr && <p className="text-danger text-sm mt-2 print:hidden">{presErr}</p>}
        {presText && (
          <HandoverSheet
            title="Consultant presentation"
            text={presText}
            onChange={setPresText}
            onPrint={() => printSheet('presentation')}
          />
        )}
      </Panel>
    </div>
  );
}

// ── Compact context row for the patient summary card ────────────────────────
function ContextRow({ label, value, span, highlight }: {
  label: string;
  value: string;
  span?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`${span ? 'sm:col-span-2' : ''} min-w-0`}>
      <span className="text-xs font-medium text-ink-mute">{label}: </span>
      <span className={`text-sm ${highlight ? 'text-warn font-medium' : 'text-ink'} break-words`}>{value}</span>
    </div>
  );
}
