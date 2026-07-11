import { useState, useEffect } from 'react';
import { toolsApi, type Discrepancy, type DiscriminatingFeature } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { intakeAssistFields } from '../fields/intake';
import { historyAssistFields } from '../fields/history';
import { assessmentAssistFields } from '../fields/assessment';
import { patientContext } from '../lib/patientContext';
import { SectionHead, Card } from '../components/ui';
import { cascadesFor, type SymptomCascade } from '../config/symptomCascades';
import { smartBlocksFor, type SmartBlock } from '../config/smartBlocks';
import { CascadePanel, EMPTY_CASCADE_VALUE, type CascadePanelValue } from '../components/CascadePanel';
import { SmartBlockCard, EMPTY_SMART_BLOCK_VALUE, type SmartBlockValue } from '../components/SmartBlockCard';
import { examChecklistFor } from '../config/examChecklists';
import { ExamCapture, findingStem, VITAL_META } from '../components/ExamCapture';
import { ImageCaptureNode } from '../components/ImageCaptureNode';
import { upsertSerialized } from '../lib/serializeIntoField';
import { WorkingPicturePanel } from '../components/WorkingPicturePanel';
import { ConfirmStream, hashFeature } from '../components/ConfirmStream';
import { useWorkingPicture } from '../lib/useWorkingPicture';
import { StageCard } from '../components/StageCard';
import { SlideOver } from '../components/SlideOver';
import { QuickBar } from '../components/QuickBar';
import { ResultsCapture, resultsSummary } from '../components/ResultsCapture';
import { QuickDocs } from '../components/QuickDocs';
import { BookOpenText, Stethoscope, FlaskConical, ClipboardList, FileText, ChevronDown, Check, AlertTriangle, Info } from 'lucide-react';
import { complaintIcon } from '../lib/icons';

// ─── BEDSIDE TAB — the cockpit ───────────────────────────────────────────────
// LOWEST-LEVEL INPUT → HIGHEST-LEVEL OUTPUT. Start → Confirm → Complete:
// START — tap a complaint (or dictate). CONFIRM — the leading diagnosis
// appears automatically; a stream of yes/no + MCQ taps (history AND exam)
// moves it live. COMPLETE — background, exam detail and results are one
// collapsed section below, filled in when there's time — background is LAST
// by design. The full record and the note are one tap away in slide-overs.

const HPI_SMART_BLOCKS = new Set(['neonatal-jaundice', 'pprom-ptl']);

type CompleteStageId = 'story' | 'examine' | 'results';

function fullRecordText(patient: Patient, dept: DeptId, subDept?: string): string {
  const vals = (o: Record<string, unknown>) =>
    Object.values(o).filter((v): v is string => typeof v === 'string');
  return [dept, subDept ?? '', ...vals(patient.intake), ...vals(patient.history), ...vals(patient.assessment)].join(' ');
}

function presentingText(patient: Patient): string {
  const vals = (o: Record<string, unknown>) =>
    Object.values(o).filter((v): v is string => typeof v === 'string');
  return [...vals(patient.intake), ...vals(patient.history)].join(' ');
}

function lowerFirst(s: string): string {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** A tap answer becomes the same clinical shorthand the rest of the record
 *  uses — yes: the finding stated positively; no: negated; MCQ: "<the
 *  question, as a stem>: <chosen option>". */
function serializeFeatureAnswer(feature: DiscriminatingFeature, value: string): string {
  const stem = feature.prompt.replace(/[?.]+$/, '').trim();
  if (feature.options && feature.options.length > 0) return `${lowerFirst(stem)}: ${value}`;
  return value === 'yes' ? lowerFirst(stem) : `no ${lowerFirst(stem)}`;
}

export function ClerkTab({ patient, toolsKey, dept, subDept, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const onIntake = (patch: Record<string, string>) =>
    onPatient({ intake: { ...patient.intake, ...patch } });
  const onHistory = (patch: Record<string, string>) =>
    onPatient({ history: { ...patient.history, ...patch } });
  const onAssessment = (patch: Record<string, string>) =>
    onPatient({ assessment: { ...patient.assessment, ...patch } });

  // The "alarmed discrepancy" net — deterministic, instant, flag-and-guide.
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const intakeSig = JSON.stringify(patient.intake);
  const historySig = JSON.stringify(patient.history);
  const assessmentSig = JSON.stringify(patient.assessment);
  useEffect(() => {
    const record: Record<string, string | undefined> = { ...patient.intake, ...patient.history, ...patient.assessment };
    const t = setTimeout(() => {
      toolsApi.checkConsistency(toolsKey, { record, subDept })
        .then(r => setDiscrepancies(r.discrepancies || []))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeSig, historySig, assessmentSig, subDept, toolsKey]);

  // Combined clerk conversation: admin + history in ONE flow.
  const intakeFields = intakeAssistFields(patient.intake, dept);
  const historyFields = historyAssistFields(patient.history, dept, subDept);
  const examFields = assessmentAssistFields(patient.assessment, dept, subDept);
  const clerkFields = [...intakeFields, ...historyFields];
  const intakeKeys = new Set(intakeFields.map(f => f.key));

  function routeClerkUpdates(u: Record<string, string>) {
    const intakePatch: Record<string, string> = {};
    const historyPatch: Record<string, string> = {};
    for (const [k, v] of Object.entries(u)) {
      if (intakeKeys.has(k)) intakePatch[k] = v;
      else historyPatch[k] = v;
    }
    if (Object.keys(intakePatch).length) onIntake(intakePatch);
    if (Object.keys(historyPatch).length) onHistory(historyPatch);
  }

  // ── Presenting complaint cascade (zero-typing) — the START gesture ─────────
  const cascades = cascadesFor(dept);
  const activeCascade: SymptomCascade | undefined = cascades.find(c => c.id === patient.activeCascadeId);
  const isFemale = /^f/i.test(patient.intake.sex.trim());

  function cascadeChanged(cascade: SymptomCascade, v: CascadePanelValue, serialized: string) {
    const persist = patient.cascades?.[cascade.id];
    const nextCC = upsertSerialized(patient.history.chiefComplaint, persist?.lastText, serialized, '; ');
    onHistory({ chiefComplaint: nextCC });
    onPatient({ cascades: { ...patient.cascades, [cascade.id]: { ...v, lastText: serialized } } });
  }

  // Tapping a complaint IS the seed — it opens the cascade for detail AND, if
  // nothing has been captured yet, sets the chief complaint to the label so the
  // working picture fires immediately (the "tap it, the diagnosis follows" law).
  // The cascade answers then refine that seed via cascadeChanged.
  function pickComplaint(c: SymptomCascade, isOn: boolean) {
    const patch: Partial<Patient> = { activeCascadeId: isOn ? undefined : c.id };
    if (!isOn && !patient.history.chiefComplaint.trim()) {
      onHistory({ chiefComplaint: c.label });
    }
    onPatient(patch);
  }

  // ── Condition-triggered smart blocks ───────────────────────────────────────
  const matchedBlocks = smartBlocksFor(fullRecordText(patient, dept, subDept), dept);

  function smartBlockChanged(block: SmartBlock, v: SmartBlockValue, serialized: string) {
    const persist = patient.smartBlocks?.[block.id];
    const target = HPI_SMART_BLOCKS.has(block.id) ? 'hpi' : 'pmh';
    const nextField = upsertSerialized(patient.history[target] ?? '', persist?.lastText, serialized, '\n');
    onHistory({ [target]: nextField });
    onPatient({ smartBlocks: { ...patient.smartBlocks, [block.id]: { ...v, lastText: serialized } } });
  }

  // ── Examination capture (values-first) + imaging ───────────────────────────
  // The exam list is built from the history (presentingText), and the VALUE is
  // the capture — vitals serialize as a reading line into assessment.vitals,
  // findings as real clinical lines ("Lung fields: creps at bases", "JVP: NAD")
  // into assessment.examination. No ticks: "Exam done: BP recorded" documented
  // ceremony, not findings.
  const sections = examChecklistFor(dept, subDept, presentingText(patient));
  const checklist = patient.examChecklist ?? { checked: {}, customNote: '' };
  const examValues = checklist.values ?? {};
  const vitalItems = sections.find(s => s.id === 'vitals')?.items ?? [];

  function examCaptureChanged(values: Record<string, string>, customNote: string) {
    const vitalsLine = vitalItems
      .filter(i => (values[i.id] ?? '').trim())
      .map(i => `${(VITAL_META[i.id]?.label ?? findingStem(i.label))} ${values[i.id].trim()}`)
      .join(', ');
    const nextVitals = upsertSerialized(patient.assessment.vitals, checklist.vitalsLastText, vitalsLine, '\n');

    const findingLines = sections
      .filter(s => s.id !== 'vitals')
      .flatMap(s => s.items)
      .filter(i => (values[i.id] ?? '').trim())
      .map(i => `${findingStem(i.label)}: ${values[i.id].trim()}`);
    if (customNote.trim()) findingLines.push(customNote.trim());
    const serialized = findingLines.join('\n');
    const nextExam = upsertSerialized(patient.assessment.examination, checklist.lastText, serialized, '\n');

    onAssessment({ examination: nextExam, vitals: nextVitals });
    onPatient({ examChecklist: { ...checklist, values, customNote, lastText: serialized, vitalsLastText: vitalsLine } });
  }

  function injectImage(injectText: string, modality: string) {
    const nextExam = patient.assessment.examination.trim()
      ? `${patient.assessment.examination.replace(/\s+$/, '')}\n${injectText}`
      : injectText;
    onAssessment({ examination: nextExam });
    onPatient({
      imageFindings: [
        ...(patient.imageFindings ?? []),
        { modality, injectText, date: new Date().toISOString().slice(0, 10) },
      ],
    });
  }

  // ── The Confirm tap stream: a tap patches the record, which re-fires ───────
  // the picture (auto-fire below). featureAnswers persists what's already
  // answered (keyed by a stable hash of the prompt) purely so the UI can show
  // the selected pill and so re-answering finds + replaces its own line
  // instead of duplicating it — the record string fields stay the single
  // source of truth the engine reads.
  function onFeatureAnswer(feature: DiscriminatingFeature, value: string) {
    const key = hashFeature(feature.prompt);
    const prevValue = patient.featureAnswers?.[key];
    const prevText = prevValue !== undefined ? serializeFeatureAnswer(feature, prevValue) : undefined;
    const nextText = serializeFeatureAnswer(feature, value);
    if (feature.kind === 'exam') {
      onAssessment({ examination: upsertSerialized(patient.assessment.examination, prevText, nextText, '\n') });
    } else {
      onHistory({ hpi: upsertSerialized(patient.history.hpi, prevText, nextText, '\n') });
    }
    onPatient({ featureAnswers: { ...patient.featureAnswers, [key]: value } });
  }

  // ── The bedside loop: working picture, auto-fired from the clerking so far ─
  const cc = patient.history.chiefComplaint.trim();
  const wpSignature = JSON.stringify({
    cc: patient.history.chiefComplaint,
    hpi: patient.history.hpi,
    exam: patient.assessment.examination,
    vitals: patient.assessment.vitals,
  });
  const wp = useWorkingPicture(patient, toolsKey, dept, subDept, onPatient, wpSignature);

  // ── Complete (collapsed) — background, exam detail, results ────────────────
  const filledStory = clerkFields.filter(f => (f.value ?? '').trim()).length;
  const capturedCount = Object.values(examValues).filter(v => v.trim()).length;
  const vitalsIn = vitalItems.filter(i => (examValues[i.id] ?? '').trim()).length;
  const findingsIn = capturedCount - vitalsIn;
  const hasVitals = patient.assessment.vitals.trim().length > 0;
  const entryCount = patient.investigations?.length ?? 0;
  const storyDone = filledStory >= 5;
  const examineDone = capturedCount > 0 && hasVitals;
  const resultsDone = entryCount > 0;
  const completeDoneCount = [storyDone, examineDone, resultsDone].filter(Boolean).length;

  const [completeOpen, setCompleteOpen] = useState(false);
  const [openStage, setOpenStage] = useState<CompleteStageId | null>('story');
  const toggle = (s: CompleteStageId) => setOpenStage(prev => (prev === s ? null : s));

  const [quickBarOpen, setQuickBarOpen] = useState(false);
  const [moreDetailOpen, setMoreDetailOpen] = useState(false);
  const [drawer, setDrawer] = useState<null | 'record' | 'docs'>(null);

  // Quick-clerk brain-dump routes a flat {key: value} back to the slice that
  // owns each key — same split as the conversational assist, extended to exam.
  const examKeys = new Set(examFields.map(f => f.key));
  function routeAnyUpdates(u: Record<string, string>) {
    const iPatch: Record<string, string> = {};
    const hPatch: Record<string, string> = {};
    const aPatch: Record<string, string> = {};
    for (const [k, v] of Object.entries(u)) {
      if (intakeKeys.has(k)) iPatch[k] = v;
      else if (examKeys.has(k)) aPatch[k] = v;
      else hPatch[k] = v;
    }
    if (Object.keys(iPatch).length) onIntake(iPatch);
    if (Object.keys(hPatch).length) onHistory(hPatch);
    if (Object.keys(aPatch).length) onAssessment(aPatch);
  }

  const storySummary = (() => {
    const who = [patient.intake.name, patient.intake.age && `${patient.intake.age}`].filter(Boolean).join(', ');
    return `${who ? `${who} — ` : ''}${filledStory}/${clerkFields.length} captured`;
  })();

  const utilityRow = (
    <div className="flex gap-2">
      <button
        onClick={() => setDrawer('record')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-md border border-line bg-surface text-sm font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <ClipboardList className="w-4 h-4" /> Full record
      </button>
      <button
        onClick={() => setDrawer('docs')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-md border border-line bg-surface text-sm font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <FileText className="w-4 h-4" /> Documents
      </button>
    </div>
  );

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-3 pb-16">
        {utilityRow}

        {discrepancies.length > 0 && (
          <div className="space-y-2">
            {discrepancies.map((d, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-xl px-4 py-3 border text-sm leading-relaxed ${
                  d.severity === 'alarm'
                    ? 'bg-warn/[0.08] border-warn/25 text-warn'
                    : 'bg-surface-alt border-line text-ink-soft'
                }`}
              >
                {d.severity === 'alarm'
                  ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  : <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />}
                <span><span className="font-semibold">{d.severity === 'alarm' ? 'Check this' : 'Note'}</span> — {d.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── START — one gesture: tap the complaint ─────────────────────────── */}
        <Card elevation="e1" className="p-4 sm:p-5 space-y-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Presenting complaint</h2>
            <p className="text-xs text-ink-soft">Tap it — the leading diagnosis follows automatically.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cascades.map(c => {
              const on = patient.activeCascadeId === c.id;
              const answered = Object.values(patient.cascades?.[c.id]?.selections ?? {}).some(s => s.length > 0);
              const CIcon = complaintIcon(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickComplaint(c, on)}
                  className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-pill text-sm border transition-colors ${
                    on
                      ? 'bg-brand-600 border-brand-600 text-white shadow-card'
                      : answered
                        ? 'bg-brand-50 border-brand-200 text-brand-800'
                        : 'bg-surface border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  <CIcon className="w-4 h-4 shrink-0" aria-hidden />
                  {c.label}
                  {answered && !on && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                </button>
              );
            })}
          </div>
          {cc && (
            <p className="text-sm text-ink-soft bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 leading-relaxed">
              <span className="text-ink-mute">→ </span>{cc}
            </p>
          )}

          {/* De-emphasised accelerator — typing/dictation is optional, never required. */}
          <div>
            <button
              type="button"
              onClick={() => setQuickBarOpen(o => !o)}
              className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink-soft transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${quickBarOpen ? 'rotate-180' : ''}`} aria-hidden />
              or say/paste it all
            </button>
            {quickBarOpen && (
              <div className="mt-2.5">
                <QuickBar
                  toolsKey={toolsKey}
                  dept={dept}
                  subDept={subDept}
                  fields={[...clerkFields, ...examFields]}
                  context={patientContext(patient, dept, subDept)}
                  onResults={routeAnyUpdates}
                />
              </div>
            )}
          </div>
        </Card>

        {/* ── CONFIRM — the hero: leading dx + the tap stream ─────────────────── */}
        {cc && (
          <div className="space-y-3">
            <WorkingPicturePanel
              picture={wp.picture}
              loading={wp.loading}
              error={wp.error}
              onGenerate={wp.generate}
              generateLabel="Build picture"
            />

            {wp.picture && (
              <ConfirmStream
                features={wp.picture.discriminatingFeatures ?? []}
                answers={patient.featureAnswers ?? {}}
                onAnswer={onFeatureAnswer}
              />
            )}

            {activeCascade && (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <button
                  type="button"
                  onClick={() => setMoreDetailOpen(o => !o)}
                  aria-expanded={moreDetailOpen}
                  className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 text-left focus:outline-none focus-visible:shadow-focus rounded-card"
                >
                  <span className="text-sm font-medium text-ink-soft">More detail — {activeCascade.label}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-ink-mute transition-transform ${moreDetailOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {moreDetailOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-line/70">
                    <CascadePanel
                      key={activeCascade.id}
                      cascade={activeCascade}
                      value={patient.cascades?.[activeCascade.id] ?? EMPTY_CASCADE_VALUE}
                      isFemale={isFemale}
                      onChange={(v, text) => cascadeChanged(activeCascade, v, text)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── COMPLETE — collapsed by default; background is last by design ───── */}
        <div className="rounded-card border border-line bg-surface shadow-card">
          <button
            type="button"
            onClick={() => setCompleteOpen(o => !o)}
            aria-expanded={completeOpen}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left focus:outline-none focus-visible:shadow-focus rounded-card"
          >
            <span className="min-w-0">
              <span className="text-sm font-semibold text-ink">Complete the record</span>
              <span className="block text-xs text-ink-mute mt-0.5">Background, exam detail, results</span>
            </span>
            <span className="shrink-0 flex items-center gap-2">
              <span className="text-2xs font-medium text-ink-mute bg-surface-alt rounded-pill px-2 py-0.5">{completeDoneCount}/3</span>
              <ChevronDown className={`w-4 h-4 text-ink-mute transition-transform duration-200 ${completeOpen ? 'rotate-180' : ''}`} aria-hidden />
            </span>
          </button>

          {completeOpen && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line/70 space-y-3">
              {/* History — background, riding smart blocks along */}
              <StageCard
                index={1}
                title="History"
                icon={BookOpenText}
                summary={storySummary}
                done={storyDone}
                open={openStage === 'story'}
                onToggle={() => toggle('story')}
              >
                <div className="space-y-4 pt-3">
                  <AssistPanel
                    toolsKey={toolsKey}
                    dept={dept}
                    subDept={subDept}
                    section="Clerking"
                    fields={clerkFields}
                    context={patientContext(patient, dept, subDept)}
                    onUpdates={u => routeClerkUpdates(u as Record<string, string>)}
                  />
                  {matchedBlocks.length > 0 && (
                    <div className="space-y-3">
                      <SectionHead>Smart Blocks — triggered by this record</SectionHead>
                      {matchedBlocks.map(b => (
                        <SmartBlockCard
                          key={b.id}
                          block={b}
                          value={patient.smartBlocks?.[b.id] ?? EMPTY_SMART_BLOCK_VALUE}
                          onChange={(v, text) => smartBlockChanged(b, v, text)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </StageCard>

              {/* Examine */}
              <StageCard
                index={2}
                title="Examine"
                icon={Stethoscope}
                summary={`${vitalsIn}/${vitalItems.length} vitals · ${findingsIn} finding${findingsIn === 1 ? '' : 's'}`}
                done={examineDone}
                open={openStage === 'examine'}
                onToggle={() => toggle('examine')}
              >
                <div className="space-y-4 pt-3">
                  <ExamCapture
                    sections={sections}
                    values={examValues}
                    customNote={checklist.customNote}
                    onValues={values => examCaptureChanged(values, checklist.customNote)}
                    onNote={note => examCaptureChanged(examValues, note)}
                    historyEmpty={!patient.history.hpi.trim()}
                  />
                  <ImageCaptureNode
                    toolsKey={toolsKey}
                    dept={dept}
                    subDept={subDept}
                    context={patientContext(patient, dept, subDept)}
                    onInject={injectImage}
                  />
                  {(patient.imageFindings?.length ?? 0) > 0 && (
                    <div className="bg-surface border border-line shadow-sm rounded-2xl p-5">
                      <SectionHead>Image findings on record</SectionHead>
                      <div className="space-y-1.5">
                        {patient.imageFindings!.map((f, i) => (
                          <p key={i} className="text-sm text-ink-soft leading-relaxed">
                            <span className="text-2xs uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-1.5 py-0.5 mr-2">
                              {f.modality}
                            </span>
                            <span className="text-ink-mute mr-2">{f.date}</span>
                            {f.injectText}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <AssistPanel
                    toolsKey={toolsKey}
                    dept={dept}
                    subDept={subDept}
                    section="Examination"
                    fields={examFields}
                    context={patientContext(patient, dept, subDept)}
                    onUpdates={u => onAssessment(u as Record<string, string>)}
                  />
                </div>
              </StageCard>

              {/* Results — the loop's second input, same canvas */}
              <StageCard
                index={3}
                title="Results"
                icon={FlaskConical}
                summary={resultsSummary(patient)}
                done={resultsDone}
                open={openStage === 'results'}
                onToggle={() => toggle('results')}
              >
                <div className="pt-3">
                  <ResultsCapture patient={patient} dept={dept} onPatient={onPatient} />
                </div>
              </StageCard>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-overs: the record and the note, one tap away ─────────────── */}
      <SlideOver open={drawer === 'record'} onClose={() => setDrawer(null)} title="Full record" wide>
        <DetailsList
          fields={[...clerkFields, ...examFields]}
          onEdit={(key, value) => {
            if (intakeKeys.has(key)) onIntake({ [key]: value });
            else if (examFields.some(f => f.key === key)) onAssessment({ [key]: value });
            else onHistory({ [key]: value });
          }}
        />
      </SlideOver>

      <SlideOver open={drawer === 'docs'} onClose={() => setDrawer(null)} title="Documents" wide>
        <QuickDocs patient={patient} toolsKey={toolsKey} dept={dept} />
      </SlideOver>
    </>
  );
}
