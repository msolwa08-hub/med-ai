import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, ListChecks, Layers, ShieldAlert, ClipboardList, BookOpen, Hospital, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { toolsApi, type Problem, type SafetyWarning, type ScreeningPrompt } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { uid } from '../lib/patient';
import { AiBtn, Card, Label, SectionHead, TextArea, TextInput } from '../components/ui';
import { severityIcon } from '../lib/icons';
import { treatmentSetsFor } from '../config/treatmentSets';
import { TreatmentSetCard } from '../components/TreatmentSetCard';
import { WhyButton } from '../components/WhyButton';

// ─── PROBLEMS TAB ────────────────────────────────────────────────────────────
// Calm Clinical progressive disclosure: the problem list is the always-visible
// primary surface. The supporting panels (screening prompts, protocol treatment
// sets, medication safety) collapse into StageCard-style rows with a filled
// one-line summary — a lighter local variant of StageCard since these are
// independent panels, not a numbered stage sequence. An active safety signal
// (a BLOCK/WARN warning, or a "safety"-category screening prompt) always forces
// its panel open — a warning is never left hidden behind a collapsed row.

// A lighter StageCard: same chrome (rounded card, icon, filled summary when
// collapsed, chevron), but the leading marker is a plain icon badge rather than
// a numbered/checked stage marker, and the panel can carry a safety "tone".
function Panel({
  icon: Icon, title, summary, tone = 'default', open, onToggle, children,
}: {
  icon: LucideIcon;
  title: string;
  summary?: string;
  tone?: 'default' | 'warn' | 'danger';
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const border = open
    ? tone === 'danger' ? 'border-danger/30 shadow-card-hover' : tone === 'warn' ? 'border-warn/30 shadow-card-hover' : 'border-brand-200 shadow-card-hover'
    : 'border-line shadow-card';
  const badge = tone === 'danger' ? 'bg-danger/10 text-danger' : tone === 'warn' ? 'bg-warn/10 text-warn' : open ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-mute';
  return (
    <section className={`rounded-card border bg-surface transition-shadow ${border}`}>
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

// Category → card colouring for screening prompts. Muted -50 backgrounds so
// four categories scan at a glance without shouting.
const SCREENING_STYLE: Record<ScreeningPrompt['category'], { card: string; chip: string }> = {
  monitoring: { card: 'bg-brand-50 border-brand-100', chip: 'bg-brand-100 text-brand-700' },
  prophylaxis: { card: 'bg-warn/[0.06] border-warn/20', chip: 'bg-warn/15 text-warn' },
  investigation: { card: 'bg-surface-alt border-line-strong', chip: 'bg-line text-ink-soft' },
  safety: { card: 'bg-danger/[0.06] border-danger/20', chip: 'bg-danger/15 text-danger' },
};

function ScreeningList({ prompts, loading }: { prompts: ScreeningPrompt[]; loading: boolean }) {
  return (
    <div className="space-y-2">
      {loading && prompts.length === 0 && (
        <p className="text-xs text-ink-mute">Checking the problem list for screening gaps…</p>
      )}
      {prompts.map((s, i) => {
        const style = SCREENING_STYLE[s.category] ?? SCREENING_STYLE.monitoring;
        return (
          <div key={i} className={`border rounded-xl px-4 py-3 space-y-1.5 ${style.card}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-2xs uppercase tracking-wide font-semibold rounded-full px-2 py-0.5 ${style.chip}`}>
                {s.category}
              </span>
              <span className="text-sm font-medium text-ink">{s.trigger}</span>
              <WhyButton why={s.why} />
            </div>
            <ul className="space-y-0.5">
              {s.prompts.map((p, j) => (
                <li key={j} className="text-sm text-ink-soft flex gap-2">
                  <span className="text-ink-mute shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function SafetyList({ warnings }: { warnings: SafetyWarning[] }) {
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => {
        const isBlock = w.severity === 'BLOCK';
        const Icon = severityIcon(isBlock ? 'block' : 'warn');
        return (
          <div
            key={i}
            className={`text-sm rounded-xl px-4 py-2.5 border ${
              isBlock ? 'bg-danger/[0.08] border-danger/20 text-danger' : 'bg-warn/[0.08] border-warn/20 text-warn'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Icon className="w-4 h-4 shrink-0" aria-hidden /> {w.drug}
            </span>
            <span className="text-2xs uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
            <p className="mt-0.5 leading-relaxed">{w.reason}</p>
          </div>
        );
      })}
    </div>
  );
}

export function ProblemsTab({ patient, toolsKey, dept, problems, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  problems: Problem[];
  onChange: (problems: Problem[]) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [warnings, setWarnings] = useState<SafetyWarning[]>([]);
  const [aiNote, setAiNote] = useState('');
  const [err, setErr] = useState('');
  const [screening, setScreening] = useState<ScreeningPrompt[]>([]);
  const [screeningLoading, setScreeningLoading] = useState(false);

  // ── Collapsible-panel open state — supporting panels default collapsed, but
  // an active safety signal (a BLOCK/WARN warning, or a "safety"-category
  // screening prompt) forces its panel open the moment it appears, so it is
  // never left hidden behind a collapsed row.
  const [openScreening, setOpenScreening] = useState(false);
  const [openSets, setOpenSets] = useState(false);
  const [openSafety, setOpenSafety] = useState(false);

  useEffect(() => {
    if (warnings.length > 0) setOpenSafety(true);
  }, [warnings]);

  useEffect(() => {
    if (screening.some(s => s.category === 'safety')) setOpenScreening(true);
  }, [screening]);

  // ── Screening prompts — refreshed (debounced) whenever the problems change ─
  const problemLines = problems
    .map(p => [p.problem, p.workingDx].filter(Boolean).join(' — '))
    .filter(Boolean);
  const problemsText = problemLines.join('\n');
  const screeningSeq = useRef(0);

  useEffect(() => {
    if (problemLines.length === 0) {
      setScreening([]);
      setScreeningLoading(false);
      return;
    }
    const seq = ++screeningSeq.current;
    setScreeningLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await toolsApi.screening(toolsKey, problemLines);
        if (screeningSeq.current === seq) setScreening(res.screening);
      } catch {
        // Quiet — screening prompts are supplementary, never blocking.
      } finally {
        if (screeningSeq.current === seq) setScreeningLoading(false);
      }
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemsText, toolsKey]);

  // ── Protocol treatment sets matched to the problem list ────────────────────
  const matchedSets = treatmentSetsFor(problemsText);

  function addToPlan(setPattern: RegExp, lines: string[]) {
    // Append into the management of the problem that triggered the card
    // (first match), falling back to the first problem.
    const target =
      problems.find(p => setPattern.test([p.problem, p.workingDx].filter(Boolean).join(' — '))) ?? problems[0];
    if (!target) return;
    onChange(problems.map(p => (p.id === target.id ? { ...p, management: [...p.management, ...lines] } : p)));
  }

  async function suggest() {
    setSuggesting(true);
    setErr('');
    try {
      const res = await toolsApi.suggestProblems(toolsKey, {
        dept,
        intake: patient.intake,
        history: patient.history,
        assessment: patient.assessment,
      });
      // Don't duplicate problems already on the list — re-clicking Suggest
      // should refine, not multiply.
      const existing = new Set(problems.map(p => p.problem.trim().toLowerCase()));
      const suggested: Problem[] = res.problems
        .filter(p => !existing.has(p.problem.trim().toLowerCase()))
        .map(p => ({
          id: uid(),
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
          status: 'active',
          icd10: p.icd10,
          stgCondition: p.stgCondition,
          protocolTitle: p.protocolTitle,
        }));
      onChange([...problems, ...suggested]);
      setWarnings(res.safety);
      setAiNote(
        suggested.length === 0 && res.problems.length > 0
          ? 'No new problems — the suggestions matched what is already on the list.'
          : res.note
      );
    } catch {
      setErr('Unable to reach the clinical engine — retry or add problems manually.');
    } finally {
      setSuggesting(false);
    }
  }

  async function checkInteractions() {
    setChecking(true);
    setErr('');
    try {
      const res = await toolsApi.interactionCheck(toolsKey, {
        medicationsText: patient.history.medications,
        allergiesText: patient.intake.allergies,
        plannedLines: problems.flatMap(p => p.management),
        problemCodes: problems.map(p => p.icd10 ?? ''),
      });
      setWarnings(res.warnings);
      if (res.warnings.length === 0) {
        setAiNote(`No interactions found across ${res.medCount} current medication${res.medCount === 1 ? '' : 's'} and the planned management.`);
      }
    } catch {
      setErr('Interaction check failed.');
    } finally {
      setChecking(false);
    }
  }

  function addProblem() {
    onChange([
      ...problems,
      {
        id: uid(),
        problem: '',
        workingDx: '',
        differentials: [],
        management: [],
        status: 'active',
      },
    ]);
  }

  function updateProblem(id: string, patch: Partial<Problem>) {
    onChange(problems.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeProblem(id: string) {
    onChange(problems.filter(p => p.id !== id));
  }

  const statusColors: Record<string, string> = {
    active: 'bg-danger/10 text-danger',
    resolving: 'bg-warn/10 text-warn',
    resolved: 'bg-positive/10 text-positive',
  };

  // ── Filled one-line summaries for the collapsed rows ───────────────────────
  const screeningSafetyCount = screening.filter(s => s.category === 'safety').length;
  const screeningSummary = screeningLoading && screening.length === 0
    ? 'Checking for screening gaps…'
    : `${screening.length} prompt${screening.length === 1 ? '' : 's'}${screeningSafetyCount ? ` · ${screeningSafetyCount} safety` : ''}`;

  const setsSummary = `${matchedSets.length} set${matchedSets.length === 1 ? '' : 's'} matched`;

  const blockCount = warnings.filter(w => w.severity === 'BLOCK').length;
  const warnCount = warnings.filter(w => w.severity === 'WARN').length;
  const safetySummary = [blockCount ? `${blockCount} BLOCK` : '', warnCount ? `${warnCount} WARN` : '']
    .filter(Boolean)
    .join(' · ');
  const safetyTone: 'danger' | 'warn' = blockCount > 0 ? 'danger' : 'warn';

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <SectionHead>Problem List</SectionHead>
        <div className="flex items-center gap-3">
          <AiBtn onClick={suggest} loading={suggesting} label="Suggest from assessment" />
          <button
            onClick={checkInteractions}
            disabled={checking}
            className="inline-flex items-center gap-1.5 text-sm bg-surface-alt hover:bg-warn/10 disabled:opacity-40 text-warn min-h-[44px] px-3.5 rounded-full font-medium transition-colors"
          >
            {checking ? 'Checking…' : (<><TriangleAlert className="w-3.5 h-3.5" aria-hidden /> Check interactions</>)}
          </button>
          <button
            onClick={addProblem}
            className="inline-flex items-center min-h-[44px] px-3 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            + Add Problem
          </button>
        </div>
      </div>

      {err && <p className="text-danger text-xs">{err}</p>}

      {suggesting && (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map(i => (
            <Card key={i} elevation="e1" className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="skeleton h-5 w-5 rounded mt-1 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="skeleton h-4 w-3/5 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-4/5 rounded" />
                  <div className="flex gap-2 mt-1">
                    <div className="skeleton h-5 w-16 rounded-full" />
                    <div className="skeleton h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {aiNote && (
        <p className="text-sm text-brand-800 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5">
          {aiNote}
        </p>
      )}

      {warnings.length > 0 && (
        <Panel
          icon={ShieldAlert}
          title="Medication safety"
          summary={safetySummary}
          tone={safetyTone}
          open={openSafety}
          onToggle={() => setOpenSafety(o => !o)}
        >
          <SafetyList warnings={warnings} />
        </Panel>
      )}

      {(screeningLoading || screening.length > 0) && (
        <Panel
          icon={ListChecks}
          title="Screening & don’t-forget prompts"
          summary={screeningSummary}
          tone={screeningSafetyCount > 0 ? 'danger' : 'default'}
          open={openScreening}
          onToggle={() => setOpenScreening(o => !o)}
        >
          <ScreeningList prompts={screening} loading={screeningLoading} />
        </Panel>
      )}

      {matchedSets.length > 0 && (
        <Panel
          icon={Layers}
          title="Protocol treatment sets"
          summary={setsSummary}
          open={openSets}
          onToggle={() => setOpenSets(o => !o)}
        >
          <p className="text-xs text-ink-mute mb-3">Deselect items not applicable to this patient.</p>
          <div className="space-y-3">
            {matchedSets.map(s => (
              <TreatmentSetCard key={s.id} set={s} onAdd={lines => addToPlan(s.pattern, lines)} />
            ))}
          </div>
        </Panel>
      )}

      {problems.length === 0 && (
        <div className="text-center py-10 text-ink-mute">
          <ClipboardList className="w-8 h-8 mx-auto mb-2" aria-hidden />
          <p className="text-sm">No problems added yet</p>
          <p className="text-xs mt-1">Use "Suggest from assessment" to generate from the clinical record, or add problems manually</p>
        </div>
      )}

      {problems.map((p, idx) => (
        <Card key={p.id} elevation="e1" className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-ink-mute text-sm font-mono mt-2 shrink-0">{idx + 1}.</span>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Problem</Label>
                  <TextInput
                    value={p.problem}
                    onChange={v => updateProblem(p.id, { problem: v })}
                    placeholder="e.g. Chest pain, fever, hyponatraemia"
                  />
                </div>
                <div className="w-32">
                  <Label>Status</Label>
                  <select
                    value={p.status}
                    onChange={e => updateProblem(p.id, { status: e.target.value as Problem['status'] })}
                    className="w-full bg-surface border border-line-strong rounded-lg px-2 py-2 text-sm text-ink focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="resolving">Resolving</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Working Diagnosis</Label>
                <TextInput
                  value={p.workingDx}
                  onChange={v => updateProblem(p.id, { workingDx: v })}
                  placeholder="Most likely diagnosis"
                />
              </div>

              <div>
                <Label>Differentials (comma-separated)</Label>
                <TextInput
                  value={p.differentials.join(', ')}
                  onChange={v => updateProblem(p.id, { differentials: v.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. ACS, PE, aortic dissection"
                />
                {p.differentials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.differentials.map((d, i) => (
                      <span key={i} className="text-xs bg-surface-alt text-ink-soft px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Management Plan (one item per line)</Label>
                <TextArea
                  value={p.management.join('\n')}
                  onChange={v => updateProblem(p.id, { management: v.split('\n').filter(Boolean) })}
                  placeholder="e.g. IV morphine 2mg q4h prn&#10;Serial ECGs&#10;Troponin in 6h"
                  rows={3}
                />
                {p.management.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {p.management.map((m, i) => {
                      const done = !!(p.managementDone?.[i]);
                      return (
                        <li key={i} className={`flex items-start gap-2 text-xs text-ink-soft ${done ? 'line-through opacity-60' : ''}`}>
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-brand-600"
                            checked={done}
                            onChange={() => updateProblem(p.id, {
                              managementDone: { ...p.managementDone, [i]: !done },
                            })}
                          />
                          {m}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => removeProblem(p.id)}
              className="text-ink-mute hover:text-danger transition-colors shrink-0 grid place-items-center w-11 h-11 rounded-lg -mr-2 -mt-1"
              aria-label="Remove problem"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
              {p.status}
            </span>
            {p.stgCondition && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100"
                title="Management anchored to this SA Standard Treatment Guideline entry"
              >
                <BookOpen className="w-3 h-3" aria-hidden /> STG: {p.stgCondition}{p.icd10 ? ` · ${p.icd10}` : ''}
              </span>
            )}
            {p.protocolTitle && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-alt text-ink-soft border border-line-strong"
                title="Management follows this facility's own uploaded protocol — overrides the generic STG where they differ"
              >
                <Hospital className="w-3 h-3" aria-hidden /> {p.protocolTitle}
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
