import { useState, useEffect, useRef } from 'react';
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
import { PaperNotes, StillToDo } from '../components/PaperNotes';
import { Glance1Briefing, briefingAvailable, cascadeForComplaint } from '../components/Glance1Briefing';
import { docSpecsFor, type DocType } from '../lib/docGen';
import { ResultsCapture, resultsSummary } from '../components/ResultsCapture';
import { QuickDocs } from '../components/QuickDocs';
import { BookOpenText, Stethoscope, FlaskConical, ClipboardList, FileText, ChevronDown, Check, AlertTriangle, Info, ListChecks, Sparkles } from 'lucide-react';
import { uid } from '../lib/patient';
import { demoPatientFor, hasDemo } from '../lib/demoPatients';
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
  const consistencySeq = useRef(0);
  const intakeSig = JSON.stringify(patient.intake);
  const historySig = JSON.stringify(patient.history);
  const assessmentSig = JSON.stringify(patient.assessment);
  useEffect(() => {
    const record: Record<string, string | undefined> = { ...patient.intake, ...patient.history, ...patient.assessment };
    const seq = ++consistencySeq.current;
    const t = setTimeout(() => {
      toolsApi.checkConsistency(toolsKey, { record, subDept })
        .then(r => { if (seq === consistencySeq.current) setDiscrepancies(r.discrepancies || []); })
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

  // Value-first history: the few high-yield fields the intern types directly
  // (the complaint is already set by the tap; the differential fires off the
  // HPI). Everything else — admin, ROS, social/family, HIV — sits behind "More"
  // so a simple history is a couple of taps, not a 16-question interview.
  const HISTORY_ESSENTIAL = new Set(['hpi', 'pmh', 'medications', 'allergies']);
  const essentialHistoryFields = clerkFields.filter(f => HISTORY_ESSENTIAL.has(f.key));
  const moreHistoryFields = clerkFields.filter(f => !HISTORY_ESSENTIAL.has(f.key) && f.key !== 'chiefComplaint');
  function editField(key: string, value: string) {
    if (intakeKeys.has(key)) onIntake({ [key]: value });
    else onHistory({ [key]: value });
  }

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

  // ── Glance 1 — the pre-encounter briefing (M-GLANCE) ───────────────────────
  // A tapped chip OR a typed complaint surfaces it — nothing is required; it
  // yields automatically the moment encounter findings land, with a quiet
  // re-peek afterwards.
  const preEncounter =
    !patient.history.hpi.trim() && !patient.assessment.vitals.trim() && !patient.assessment.examination.trim();
  const [briefingPeek, setBriefingPeek] = useState(false);
  const [changingComplaint, setChangingComplaint] = useState(false);
  const [tapStreamOpen, setTapStreamOpen] = useState(false);
  const briefingCascade =
    activeCascade ?? cascadeForComplaint(patient.history.chiefComplaint, cascades);
  const showBriefing =
    !!briefingCascade && briefingAvailable(briefingCascade, dept) && (preEncounter || briefingPeek);

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
  const surveySections = sections.filter(s => s.id !== 'vitals');

  // The FOCUSED exam is the engine's differential-driven kind:'exam' features —
  // the ≤8 signs that actually discriminate the leading diagnoses. Mapped to
  // value-capture rows (type the finding / tap NAD), keyed by a stable prompt
  // hash so re-entry replaces the same line. The static department survey is
  // demoted to the optional disclosure inside ExamCapture.
  const examFocusItems = (patient.workingPicture?.discriminatingFeatures ?? [])
    .filter(f => f.kind === 'exam')
    .map(f => ({
      id: hashFeature(f.prompt),
      label: f.prompt,
      why: `Discriminates ${f.dx} — ${f.ifPresent === 'up' ? 'raises' : 'lowers'} it if present.`,
    }));

  // Everything the intern might type a finding into — vitals + focus + survey —
  // so serialization covers whichever block the value came from.
  const allFindingItems = [...examFocusItems, ...surveySections.flatMap(s => s.items)];
  // De-dupe by normalized stem (a focus feature can restate a survey item) —
  // keep the first (focus wins), so a finding never serializes twice.
  const dedupFindingItems = allFindingItems.filter(
    (it, i) => allFindingItems.findIndex(o => findingStem(o.label).toLowerCase() === findingStem(it.label).toLowerCase()) === i
  );

  function examCaptureChanged(values: Record<string, string>, customNote: string) {
    const vitalsLine = vitalItems
      .filter(i => (values[i.id] ?? '').trim())
      .map(i => `${(VITAL_META[i.id]?.label ?? findingStem(i.label))} ${values[i.id].trim()}`)
      .join(', ');
    const nextVitals = upsertSerialized(patient.assessment.vitals, checklist.vitalsLastText, vitalsLine, '\n');

    const findingLines = dedupFindingItems
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

  // ── Differential → problem list bridge ─────────────────────────────────────
  // The engine's thinking flows straight into the persistent problem list — no
  // separate tab, no manual "Suggest from assessment". The leading differential
  // becomes the working problem (its rivals ride along as the differential, the
  // picture's "do now" as the management); ProblemsTab then layers STG,
  // screening and treatment sets on top. Idempotent: dedupe by dx.
  const leadingDx = wp.picture?.differentials?.[0]?.dx?.trim() ?? '';
  const alreadyCarried =
    !!leadingDx && (patient.problems ?? []).some(p => p.problem.trim().toLowerCase() === leadingDx.toLowerCase());
  function carryToProblems() {
    const pic = wp.picture;
    if (!pic || !pic.differentials.length) return;
    const existing = new Set((patient.problems ?? []).map(p => p.problem.trim().toLowerCase()));
    const lead = pic.differentials[0];
    if (existing.has(lead.dx.trim().toLowerCase())) return;
    onPatient({
      problems: [
        ...(patient.problems ?? []),
        {
          id: uid(),
          problem: lead.dx,
          workingDx: lead.dx,
          differentials: pic.differentials.slice(1).map(d => d.dx),
          management: Array.isArray(pic.managementNow) ? pic.managementNow : [],
          status: 'active',
          icd10: lead.icd10,
        },
      ],
    });
  }

  // ── "See it in action" — seed a worked example so a newcomer watches the
  //    whole loop build itself. Only offered on a truly empty patient. ─────────
  const patientIsEmpty =
    !cc && !patient.history.hpi.trim() && (patient.problems?.length ?? 0) === 0 && !patient.assessment.vitals.trim();
  function loadExample() {
    const demo = demoPatientFor(dept);
    if (!demo) return;
    onPatient({ intake: demo.intake, history: demo.history, assessment: demo.assessment, practice: true });
  }

  // ── Complete (collapsed) — background, exam detail, results ────────────────
  const filledStory = clerkFields.filter(f => (f.value ?? '').trim()).length;
  const capturedCount = Object.values(examValues).filter(v => v.trim()).length;
  const vitalsIn = vitalItems.filter(i => (examValues[i.id] ?? '').trim()).length;
  const findingsIn = capturedCount - vitalsIn;
  // Nothing here is "done" or "not done" — sections describe what exists,
  // never progress toward a requirement.

  const [completeOpen, setCompleteOpen] = useState(false);
  const [openStage, setOpenStage] = useState<CompleteStageId | null>('story');
  const toggle = (s: CompleteStageId) => setOpenStage(prev => (prev === s ? null : s));

  const [moreDetailOpen, setMoreDetailOpen] = useState(false);
  const [moreHistoryOpen, setMoreHistoryOpen] = useState(false);
  const [aiInterviewOpen, setAiInterviewOpen] = useState(false);
  const [drawer, setDrawer] = useState<null | 'record' | 'docs'>(null);
  // One-tap documents: a chip both opens the drawer AND starts generating.
  const [docsInitial, setDocsInitial] = useState<DocType | undefined>(undefined);
  function openDoc(type: DocType) {
    setDocsInitial(type);
    setDrawer('docs');
  }

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
    // A typed story is as good as a tapped chip: if nothing has named the
    // complaint yet, seed it from the first clause of the HPI so the picture
    // and briefing fire without the user ever hunting for a field.
    if (!patient.history.chiefComplaint.trim() && !hPatch.chiefComplaint && hPatch.hpi?.trim()) {
      hPatch.chiefComplaint = hPatch.hpi.split(/[.;\n]/)[0].trim().slice(0, 80);
    }
    if (Object.keys(iPatch).length) onIntake(iPatch);
    if (Object.keys(hPatch).length) onHistory(hPatch);
    if (Object.keys(aPatch).length) onAssessment(aPatch);
  }

  // No X/Y counters anywhere — a summary says who this is, never how much is
  // "still missing".
  const storySummary = (() => {
    const who = [patient.intake.name, patient.intake.age && `${patient.intake.age}`].filter(Boolean).join(', ');
    return who || 'enter clinical details as available';
  })();

  const utilityRow = (
    <div className="flex gap-2">
      <button
        onClick={() => setDrawer('record')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-md border border-line bg-surface text-sm font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <ClipboardList className="w-4 h-4" /> Full record
      </button>
      <button
        onClick={() => setDrawer('docs')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-md border border-line bg-surface text-sm font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <FileText className="w-4 h-4" /> Documents
      </button>
    </div>
  );

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-3 pb-16">
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

        {/* ── THE CHATBOX — the one input surface (Glance 2). The encounter
            happened on paper; fragments or a photo land here and everything
            routes itself. Pre-encounter it steps aside for Glance 1 (the
            briefing is the star before you go in; the chatbox after). ──────── */}
        {!preEncounter && (
          <QuickBar
            toolsKey={toolsKey}
            dept={dept}
            subDept={subDept}
            fields={[...clerkFields, ...examFields]}
            context={patientContext(patient, dept, subDept)}
            onResults={routeAnyUpdates}
            title="Enter clinical findings"
            cta="Submit"
            placeholder={'e.g. "BP 145/92, tachy, creps L base"'}
          />
        )}

        {/* ── START — one gesture: tap the complaint. Once the encounter is
            documented the whole card collapses to one line (criterion 8):
            the default path is chatbox → picture → paper notes, nothing else. */}
        {!preEncounter && cc && !changingComplaint ? (
          <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface shadow-card px-4 py-3">
            <p className="min-w-0 text-sm text-ink-soft truncate">
              <span className="text-2xs font-semibold uppercase tracking-wider text-ink-mute mr-2">Complaint</span>
              {cc}
            </p>
            <div className="shrink-0 flex items-center gap-3">
              {!!briefingCascade && briefingAvailable(briefingCascade, dept) && (
                <button
                  type="button"
                  onClick={() => setBriefingPeek(o => !o)}
                  className="text-xs text-ink-mute hover:text-ink-soft transition-colors"
                >
                  {briefingPeek ? 'Hide briefing' : 'Briefing'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setChangingComplaint(true)}
                className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
        <Card elevation="e1" className="p-4 sm:p-5 space-y-3.5">
          <h2 className="text-sm font-semibold text-ink">Presenting complaint</h2>
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

          {/* When re-picking mid-encounter, offer the way back down. */}
          {!preEncounter && cc && (
            <button
              type="button"
              onClick={() => setChangingComplaint(false)}
              className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink-soft transition-colors"
            >
              Collapse
            </button>
          )}

          {/* First-run: seed a worked example so the loop demonstrates itself. */}
          {patientIsEmpty && hasDemo(dept) && (
            <button
              type="button"
              onClick={loadExample}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 text-sm font-medium text-brand-800 hover:bg-brand-50 transition-colors focus:outline-none focus-visible:shadow-focus"
            >
              <Sparkles className="w-4 h-4" aria-hidden />
              Load a demonstration case
            </button>
          )}
        </Card>
        )}

        {/* ── GLANCE 1 — before the encounter: ask / don't miss / exam focus ─── */}
        {showBriefing && briefingCascade && (
          <Glance1Briefing cascade={briefingCascade} dept={dept} subDept={subDept} isFemale={isFemale} />
        )}

        {/* Pre-encounter, the chatbox waits below the briefing — ready for the
            moment the paper notes exist. */}
        {preEncounter && (
          <QuickBar
            toolsKey={toolsKey}
            dept={dept}
            subDept={subDept}
            fields={[...clerkFields, ...examFields]}
            context={patientContext(patient, dept, subDept)}
            onResults={routeAnyUpdates}
            title="Enter clinical findings"
            cta="Submit"
            placeholder={'e.g. "BP 145/92, tachy, creps L base"'}
          />
        )}

        {/* ── CONFIRM — the hero. Builds from WHATEVER exists: a tapped or
            typed complaint, or nothing but chatbox fragments. Never gated on
            a required field (M-GLANCE). ─────────────────────────────────────── */}
        {(cc || !preEncounter) && (
          <div className="space-y-3">
            <WorkingPicturePanel
              picture={wp.picture}
              loading={wp.loading}
              error={wp.error}
              onGenerate={wp.generate}
              generateLabel="Generate picture"
              hideManagement
            />

            {wp.picture && wp.picture.differentials.length > 0 && (
              <button
                type="button"
                onClick={carryToProblems}
                disabled={alreadyCarried}
                className={`w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md border text-sm font-medium transition-colors focus:outline-none focus-visible:shadow-focus ${
                  alreadyCarried
                    ? 'border-line bg-surface-alt text-ink-mute cursor-default'
                    : 'border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100'
                }`}
              >
                {alreadyCarried ? (
                  <><Check className="w-4 h-4" aria-hidden /> On the problem list</>
                ) : (
                  <><ListChecks className="w-4 h-4" aria-hidden /> Carry to problem list</>
                )}
              </button>
            )}

            {/* What gets transcribed onto the chart — Ix + Mx, big type. */}
            {wp.picture && <PaperNotes picture={wp.picture} />}

            {/* Quiet, ignorable: everything a consultant might still ask
                about — history and exam gaps together. Never gating. */}
            {wp.picture && (
              <StillToDo
                features={wp.picture.discriminatingFeatures ?? []}
                answers={patient.featureAnswers ?? {}}
              />
            )}

            {/* The tap stream, DEMOTED off the default path (criterion 8):
                available behind one disclosure for those who want to answer
                the discriminating questions by tapping. */}
            {wp.picture && (wp.picture.discriminatingFeatures ?? []).some(f => f.kind === 'history') && (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <button
                  type="button"
                  onClick={() => setTapStreamOpen(o => !o)}
                  aria-expanded={tapStreamOpen}
                  className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 text-left focus:outline-none focus-visible:shadow-focus rounded-card"
                >
                  <span className="text-sm font-medium text-ink-soft">Tap to confirm findings</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-ink-mute transition-transform ${tapStreamOpen ? 'rotate-180' : ''}`} aria-hidden />
                </button>
                {tapStreamOpen && (
                  <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-line/70">
                    <ConfirmStream
                      features={(wp.picture.discriminatingFeatures ?? []).filter(f => f.kind === 'history')}
                      answers={patient.featureAnswers ?? {}}
                      onAnswer={onFeatureAnswer}
                    />
                  </div>
                )}
              </div>
            )}

            {/* One-tap documents — each chip generates straight from the
                accumulated record (incl. photo-ingested notes). */}
            {!preEncounter && (
              <div className="flex flex-wrap items-center gap-1.5 px-1.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-ink-mute mr-0.5">Documents</span>
                {docSpecsFor(dept)
                  .filter(s => ['presentation', 'discharge', 'referral', 'mse'].includes(s.id))
                  .map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openDoc(s.id)}
                      className="inline-flex items-center min-h-[44px] px-3.5 rounded-pill border border-line bg-surface text-sm font-medium text-ink-soft hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 transition-colors focus:outline-none focus-visible:shadow-focus"
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            )}

            {activeCascade && (
              <div className="rounded-card border border-line bg-surface shadow-card">
                <button
                  type="button"
                  onClick={() => setMoreDetailOpen(o => !o)}
                  aria-expanded={moreDetailOpen}
                  className="w-full flex items-center justify-between gap-2 px-4 sm:px-5 py-3 text-left focus:outline-none focus-visible:shadow-focus rounded-card"
                >
                  <span className="text-sm font-medium text-ink-soft">{activeCascade.label}</span>
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

        {/* Record + document shortcuts — below the start moment, not above it. */}
        {utilityRow}

        {/* ── MORE DETAIL — optional, collapsed, never counted. No "complete",
            no n/3: the record is never incomplete (M-GLANCE criterion 8). ───── */}
        <div className="rounded-card border border-line bg-surface shadow-card">
          <button
            type="button"
            onClick={() => setCompleteOpen(o => !o)}
            aria-expanded={completeOpen}
            className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left focus:outline-none focus-visible:shadow-focus rounded-card"
          >
            <span className="text-sm font-semibold text-ink">More detail</span>
            <ChevronDown className={`w-4 h-4 shrink-0 text-ink-mute transition-transform duration-200 ${completeOpen ? 'rotate-180' : ''}`} aria-hidden />
          </button>

          {completeOpen && (
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-line/70 space-y-3">
              {/* History — background, riding smart blocks along */}
              <StageCard
                title="History"
                icon={BookOpenText}
                summary={storySummary}
                open={openStage === 'story'}
                onToggle={() => toggle('story')}
              >
                <div className="space-y-4 pt-3">
                  {/* Value-first essentials — type the HPI, the differential
                      sharpens as you go. No 16-question interview by default. */}
                  <DetailsList fields={essentialHistoryFields} onEdit={editField} />

                  {matchedBlocks.length > 0 && (
                    <div className="space-y-3">
                      <SectionHead>Smart Blocks</SectionHead>
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

                  {/* More — admin, ROS, social/family, HIV — there if wanted. */}
                  <div className="rounded-xl border border-line">
                    <button
                      type="button"
                      onClick={() => setMoreHistoryOpen(o => !o)}
                      aria-expanded={moreHistoryOpen}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                    >
                      <span className="text-xs font-medium text-ink-soft">More history</span>
                      <ChevronDown className={`w-4 h-4 text-ink-mute transition-transform ${moreHistoryOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {moreHistoryOpen && (
                      <div className="px-3 pb-3 pt-0.5 border-t border-line/70">
                        <DetailsList fields={moreHistoryFields} onEdit={editField} />
                      </div>
                    )}
                  </div>

                  {/* Optional accelerator: let the AI interview instead of typing. */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setAiInterviewOpen(o => !o)}
                      className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink-soft transition-colors"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${aiInterviewOpen ? 'rotate-180' : ''}`} aria-hidden />
                      or use AI-assisted history-taking
                    </button>
                    {aiInterviewOpen && (
                      <div className="mt-2.5">
                        <AssistPanel
                          toolsKey={toolsKey}
                          dept={dept}
                          subDept={subDept}
                          section="Clerking"
                          fields={clerkFields}
                          context={patientContext(patient, dept, subDept)}
                          onUpdates={u => routeClerkUpdates(u as Record<string, string>)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </StageCard>

              {/* Examine — the summary states what EXISTS, never what's "left". */}
              <StageCard
                title="Examine"
                icon={Stethoscope}
                summary={capturedCount > 0 ? `${capturedCount} finding${capturedCount === 1 ? '' : 's'} recorded` : 'enter findings as obtained'}
                open={openStage === 'examine'}
                onToggle={() => toggle('examine')}
              >
                <div className="space-y-4 pt-3">
                  <ExamCapture
                    vitals={vitalItems}
                    focus={examFocusItems}
                    survey={surveySections}
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
                </div>
              </StageCard>

              {/* Results — the loop's second input, same canvas */}
              <StageCard
                title="Results"
                icon={FlaskConical}
                summary={resultsSummary(patient)}
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

      <SlideOver open={drawer === 'docs'} onClose={() => { setDrawer(null); setDocsInitial(undefined); }} title="Documents" wide>
        <QuickDocs key={docsInitial ?? 'all'} patient={patient} toolsKey={toolsKey} dept={dept} initialDoc={docsInitial} />
      </SlideOver>
    </>
  );
}
