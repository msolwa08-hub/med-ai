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

// ─── CLERK TAB ───────────────────────────────────────────────────────────────
// One continuous page for the whole first pass: identify -> history -> examine.
// The naive-intern brief is explicit — no switching between a "History" page and
// an "Exam" page to clerk one patient. Admin + history are captured in a SINGLE
// assist conversation (history fills in the background as they answer), the exam
// lives right below on the same scroll, and a plain-text presentation can be
// generated from whatever has been captured so far, at any point.

const HPI_SMART_BLOCKS = new Set(['neonatal-jaundice', 'pprom-ptl']);

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
  // Runs (debounced) as the intern clerks and surfaces misplaced / contradictory
  // / implausible input near the top of the page, never blocking.
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

  // Combined clerk conversation: admin + history in ONE flow. The assist engine
  // returns a flat {key: value}; route each key back to the slice that owns it.
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
  const matchedBlocks = smartBlocksFor(fullRecordText(patient, dept, subDept));

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

  // ── Admission note (formal first document, generated from the clerking) ────
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

  return (
    <div className="space-y-5">
      {/* 0 — Discrepancy alarms: flag & guide, never block */}
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

      {/* 1 — Presenting complaint, chip-first, zero typing */}
      <div className="bg-surface border border-line shadow-sm rounded-2xl p-5 space-y-4">
        <SectionHead>Presenting Complaint</SectionHead>
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
        {patient.history.chiefComplaint && (
          <p className="text-[13px] text-ink-soft bg-surface-alt border border-line rounded-xl px-3.5 py-2.5 leading-relaxed">
            <span className="text-ink-mute">→ </span>{patient.history.chiefComplaint}
          </p>
        )}
      </div>

      {/* 2 — One clerking conversation: admin + history, filling in the background */}
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

      {/* 3 — Examination, on the SAME page (no tab switch) */}
      <div className="pt-1">
        <SectionHead>Examination</SectionHead>
      </div>
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

      {/* Working picture — the live differential the clerking builds toward */}
      <WorkingPicturePanel
        picture={wp.picture}
        loading={wp.loading}
        error={wp.error}
        onGenerate={wp.generate}
        generateLabel="Build picture"
      />

      {/* 4 — Everything captured, in one editable list */}
      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={[...clerkFields, ...examFields]}
          onEdit={(key, value) => {
            if (intakeKeys.has(key)) onIntake({ [key]: value });
            else if (examFields.some(f => f.key === key)) onAssessment({ [key]: value });
            else onHistory({ [key]: value });
          }}
        />
      </div>

      {/* 5 — Admission note from the clerking (the consultant presentation and
          daily round live in the Round & Handover tab) */}
      <div className="bg-surface border border-line shadow-sm rounded-2xl p-5">
        <SectionHead>Admission Note</SectionHead>
        <p className="text-ink-mute text-xs mb-4">
          Generates the formal admission note from the clerking so far. The consultant presentation and daily ward round are in the Round &amp; Handover tab.
        </p>
        <div className="flex gap-3">
          <AiBtn onClick={generateAdmission} loading={admLoading} label="Generate admission note" />
        </div>
        {admErr && <p className="text-red-500 text-xs mt-2">{admErr}</p>}
        {admNote && <DocOutput text={admNote} />}
      </div>
    </div>
  );
}
