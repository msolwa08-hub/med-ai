import { useState, useEffect } from 'react';
import { toolsApi, type Discrepancy } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { intakeAssistFields } from '../fields/intake';
import { historyAssistFields } from '../fields/history';
import { assessmentAssistFields } from '../fields/assessment';
import { patientContext } from '../lib/patientContext';
import { AiBtn, DocOutput, SectionHead } from '../components/ui';
import { cascadesFor, type SymptomCascade } from '../config/symptomCascades';
import { smartBlocksFor, type SmartBlock } from '../config/smartBlocks';
import { CascadePanel, EMPTY_CASCADE_VALUE, type CascadePanelValue } from '../components/CascadePanel';
import { SmartBlockCard, EMPTY_SMART_BLOCK_VALUE, type SmartBlockValue } from '../components/SmartBlockCard';
import { examChecklistFor } from '../config/examChecklists';
import { ExamChecklist } from '../components/ExamChecklist';
import { ImageCaptureNode } from '../components/ImageCaptureNode';
import { upsertSerialized } from '../lib/serializeIntoField';
import { WorkingPicturePanel } from '../components/WorkingPicturePanel';
import { useWorkingPicture } from '../lib/useWorkingPicture';
import { StageCard } from '../components/StageCard';
import { SlideOver } from '../components/SlideOver';
import { PictureSheet } from '../components/PictureSheet';
import { QuickBar } from '../components/QuickBar';
import { ResultsCapture, resultsSummary } from '../components/ResultsCapture';
import { MessageSquareText, BookOpenText, Stethoscope, FlaskConical, ClipboardList, FileText } from 'lucide-react';

// ─── BEDSIDE TAB — the cockpit ───────────────────────────────────────────────
// One canvas for the whole loop. LEFT: the capture stream — four stages
// (Complaint → Story → Examine → Results) with progressive disclosure, so the
// page is always a handful of quiet rows plus one working area. RIGHT: the
// living working picture, sticky — type a finding, watch the differential move
// beside you. The full record and the admission note are one tap away in
// slide-overs, never occupying the canvas.

const HPI_SMART_BLOCKS = new Set(['neonatal-jaundice', 'pprom-ptl']);

type StageId = 'complaint' | 'story' | 'examine' | 'results';

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

  // ── Presenting complaint cascade (zero-typing) ─────────────────────────────
  const cascades = cascadesFor(dept);
  const activeCascade: SymptomCascade | undefined = cascades.find(c => c.id === patient.activeCascadeId);
  const isFemale = /^f/i.test(patient.intake.sex.trim());

  function cascadeChanged(cascade: SymptomCascade, v: CascadePanelValue, serialized: string) {
    const persist = patient.cascades?.[cascade.id];
    const nextCC = upsertSerialized(patient.history.chiefComplaint, persist?.lastText, serialized, '; ');
    onHistory({ chiefComplaint: nextCC });
    onPatient({ cascades: { ...patient.cascades, [cascade.id]: { ...v, lastText: serialized } } });
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

  // ── Examination checklist + imaging ────────────────────────────────────────
  const sections = examChecklistFor(dept, subDept, presentingText(patient));
  const checklist = patient.examChecklist ?? { checked: {}, customNote: '' };

  function checklistChanged(checked: Record<string, boolean>, customNote: string) {
    const doneLabels = sections
      .flatMap(s => s.items)
      .filter(i => checked[i.id])
      .map(i => i.label);
    const parts = [...doneLabels];
    if (customNote.trim()) parts.push(customNote.trim());
    const serialized = parts.length > 0 ? `Exam done: ${parts.join('; ')}` : '';
    const nextExam = upsertSerialized(patient.assessment.examination, checklist.lastText, serialized, '\n');
    onAssessment({ examination: nextExam });
    onPatient({ examChecklist: { checked, customNote, lastText: serialized } });
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

  // ── The bedside loop: working picture from the clerking so far ─────────────
  const wp = useWorkingPicture(patient, toolsKey, dept, subDept, onPatient);

  // ── Admission note (in a slide-over; the note is a byproduct, not the canvas)
  const [admLoading, setAdmLoading] = useState(false);
  const [admNote, setAdmNote] = useState(patient.admissionNote ?? '');
  const [admErr, setAdmErr] = useState('');

  async function generateAdmission() {
    setAdmLoading(true);
    setAdmErr('');
    try {
      const r = await toolsApi.admissionNote(toolsKey, {
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        dayOfAdmission: patient.assessment.dayOfAdmission,
      });
      const text = `ADMISSION NOTE\n==============\n\n${r.admissionNote}\n\nWORKING DIAGNOSIS: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nINITIAL PLAN:\n${r.initialPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      setAdmNote(text);
      onPatient({ admissionNote: text });
    } catch {
      setAdmErr('Failed to generate admission note.');
    } finally {
      setAdmLoading(false);
    }
  }

  // ── Stage state — progressive disclosure ───────────────────────────────────
  const cc = patient.history.chiefComplaint.trim();
  const filledStory = clerkFields.filter(f => (f.value ?? '').trim()).length;
  const checkedCount = Object.values(checklist.checked).filter(Boolean).length;
  const totalItems = sections.reduce((a, s) => a + s.items.length, 0);
  const hasVitals = patient.assessment.vitals.trim().length > 0;
  const entryCount = patient.investigations?.length ?? 0;

  const [openStage, setOpenStage] = useState<StageId | null>(() => {
    if (!cc) return 'complaint';
    if (filledStory < 4) return 'story';
    if (checkedCount === 0) return 'examine';
    return 'results';
  });
  const toggle = (s: StageId) => setOpenStage(prev => (prev === s ? null : s));

  const [drawer, setDrawer] = useState<null | 'record' | 'note'>(null);

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

  const picturePanel = (
    <WorkingPicturePanel
      picture={wp.picture}
      loading={wp.loading}
      error={wp.error}
      onGenerate={wp.generate}
      generateLabel="Build picture"
    />
  );

  const utilityRow = (
    <div className="flex gap-2">
      <button
        onClick={() => setDrawer('record')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <ClipboardList className="w-4 h-4" /> Full record
      </button>
      <button
        onClick={() => setDrawer('note')}
        className="flex-1 inline-flex items-center justify-center gap-2 min-h-[42px] px-3 rounded-xl border border-line bg-surface text-[13px] font-medium text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors focus:outline-none focus-visible:shadow-focus"
      >
        <FileText className="w-4 h-4" /> Admission note
      </button>
    </div>
  );

  return (
    <>
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* ── LEFT: the capture stream ─────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-3 pb-20 lg:pb-0">
          {/* The fast way in: dump the whole clerking (typed or spoken) → one
              call fills every field. The staged forms below are the fallback. */}
          <QuickBar
            toolsKey={toolsKey}
            dept={dept}
            subDept={subDept}
            fields={[...clerkFields, ...examFields]}
            context={patientContext(patient, dept, subDept)}
            onResults={routeAnyUpdates}
          />

          {discrepancies.length > 0 && (
            <div className="space-y-2">
              {discrepancies.map((d, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-4 py-3 border text-[14px] leading-relaxed ${
                    d.severity === 'alarm'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-surface-alt border-line text-ink-soft'
                  }`}
                >
                  <span className="font-semibold">{d.severity === 'alarm' ? '⚠ Check this' : 'ℹ Note'}</span> — {d.message}
                </div>
              ))}
            </div>
          )}

          {/* 1 — Complaint */}
          <StageCard
            index={1}
            title="Complaint"
            icon={MessageSquareText}
            summary={cc || 'Tap the presenting complaint — zero typing'}
            done={!!cc}
            open={openStage === 'complaint'}
            onToggle={() => toggle('complaint')}
          >
            <div className="space-y-4 pt-3">
              <div className="flex flex-wrap gap-1.5">
                {cascades.map(c => {
                  const on = patient.activeCascadeId === c.id;
                  const answered = Object.values(patient.cascades?.[c.id]?.selections ?? {}).some(s => s.length > 0);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onPatient({ activeCascadeId: on ? undefined : c.id })}
                      className={`min-h-[44px] px-3.5 rounded-2xl text-sm border transition-colors ${
                        on
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : answered
                            ? 'bg-brand-50 border-brand-200 text-brand-800'
                            : 'bg-surface border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50'
                      }`}
                    >
                      {c.icon ? `${c.icon} ` : ''}{c.label}{answered && !on ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
              {activeCascade && (
                <div className="border-t border-line pt-4">
                  <CascadePanel
                    key={activeCascade.id}
                    cascade={activeCascade}
                    value={patient.cascades?.[activeCascade.id] ?? EMPTY_CASCADE_VALUE}
                    isFemale={isFemale}
                    onChange={(v, text) => cascadeChanged(activeCascade, v, text)}
                  />
                </div>
              )}
              {cc && (
                <p className="text-[13px] text-ink-soft bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 leading-relaxed">
                  <span className="text-ink-mute">→ </span>{cc}
                </p>
              )}
            </div>
          </StageCard>

          {/* 2 — Story: one clerking conversation, smart blocks riding along */}
          <StageCard
            index={2}
            title="Story"
            icon={BookOpenText}
            summary={storySummary}
            done={filledStory >= 5}
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

          {/* 3 — Examine */}
          <StageCard
            index={3}
            title="Examine"
            icon={Stethoscope}
            summary={`${checkedCount}/${totalItems} exam items${hasVitals ? ' · vitals in' : ''}`}
            done={checkedCount > 0 && hasVitals}
            open={openStage === 'examine'}
            onToggle={() => toggle('examine')}
          >
            <div className="space-y-4 pt-3">
              <ExamChecklist
                sections={sections}
                checked={checklist.checked}
                customNote={checklist.customNote}
                onToggle={(id, on) => checklistChanged({ ...checklist.checked, [id]: on }, checklist.customNote)}
                onNote={note => checklistChanged(checklist.checked, note)}
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
                      <p key={i} className="text-[13px] text-ink-soft leading-relaxed">
                        <span className="text-[11px] uppercase tracking-wide text-brand-700 bg-brand-50 rounded px-1.5 py-0.5 mr-2">
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

          {/* 4 — Results: the loop's second input, same canvas */}
          <StageCard
            index={4}
            title="Results"
            icon={FlaskConical}
            summary={resultsSummary(patient)}
            done={entryCount > 0}
            open={openStage === 'results'}
            onToggle={() => toggle('results')}
          >
            <div className="pt-3">
              <ResultsCapture patient={patient} dept={dept} onPatient={onPatient} />
            </div>
          </StageCard>
        </div>

        {/* ── RIGHT: the living picture, always beside the input ───────────── */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-2 space-y-3 max-h-[calc(100vh-8.5rem)] overflow-y-auto scrollbar-thin pr-0.5 pb-2">
          {picturePanel}
          {utilityRow}
        </div>
      </div>

      {/* Phone/tablet: the picture pinned to the bottom as a sheet */}
      <PictureSheet picture={wp.picture}>
        {picturePanel}
        {utilityRow}
      </PictureSheet>

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

      <SlideOver open={drawer === 'note'} onClose={() => setDrawer(null)} title="Admission note" wide>
        <div className="space-y-3">
          <p className="text-ink-mute text-xs">
            Generated from the clerking so far — the note is a byproduct of the thinking, not the work itself.
            The consultant presentation and daily round live in Round &amp; Handover.
          </p>
          <AiBtn onClick={generateAdmission} loading={admLoading} label="Generate admission note" />
          {admErr && <p className="text-band-exclude text-xs">{admErr}</p>}
          {admNote && <DocOutput text={admNote} />}
        </div>
      </SlideOver>
    </>
  );
}
