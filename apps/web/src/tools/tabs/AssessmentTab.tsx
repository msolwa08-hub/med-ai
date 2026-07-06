import { useState } from 'react';
import { toolsApi } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { AssessmentData, Patient } from '../fields/types';
import { assessmentAssistFields } from '../fields/assessment';
import { patientContext } from '../lib/patientContext';
import { AiBtn, DocOutput, SectionHead, copy } from '../components/ui';
import { examChecklistFor } from '../config/examChecklists';
import { ExamChecklist } from '../components/ExamChecklist';
import { ImageCaptureNode } from '../components/ImageCaptureNode';
import { upsertSerialized } from '../lib/serializeIntoField';

// ─── ASSESSMENT TAB ──────────────────────────────────────────────────────────

/** Intake + history text — what the exam checklist adapts to. */
function presentingText(patient: Patient): string {
  const vals = (o: Record<string, unknown>) =>
    Object.values(o).filter((v): v is string => typeof v === 'string');
  return [...vals(patient.intake), ...vals(patient.history)].join(' ');
}

export function AssessmentTab({ patient, toolsKey, dept, subDept, onChange, onAdmNote, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<AssessmentData>) => void;
  onAdmNote: (note: string) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(patient.admissionNote ?? '');
  const [err, setErr] = useState('');

  // ── Proactive exam checklist (persisted additively per patient) ────────────
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
    onChange({ examination: nextExam });
    onPatient({ examChecklist: { checked, customNote, lastText: serialized } });
  }

  function injectImage(injectText: string, modality: string) {
    const nextExam = patient.assessment.examination.trim()
      ? `${patient.assessment.examination.replace(/\s+$/, '')}\n${injectText}`
      : injectText;
    onChange({ examination: nextExam });
    onPatient({
      imageFindings: [
        ...(patient.imageFindings ?? []),
        { modality, injectText, date: new Date().toISOString().slice(0, 10) },
      ],
    });
  }

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const r = await toolsApi.admissionNote(toolsKey, {
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        dayOfAdmission: patient.assessment.dayOfAdmission,
      });
      const text = `ADMISSION NOTE\n==============\n\n${r.admissionNote}\n\nWORKING DIAGNOSIS: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nINITIAL PLAN:\n${r.initialPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      setResult(text);
      onAdmNote(text);
    } catch {
      setErr('Failed to generate admission note.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
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
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <SectionHead>Image findings on record</SectionHead>
          <div className="space-y-1.5">
            {patient.imageFindings!.map((f, i) => (
              <p key={i} className="text-[13px] text-gray-600 leading-relaxed">
                <span className="text-[11px] uppercase tracking-wide text-teal-700 bg-teal-50 rounded px-1.5 py-0.5 mr-2">
                  {f.modality}
                </span>
                <span className="text-gray-400 mr-2">{f.date}</span>
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
        section="Assessment"
        fields={assessmentAssistFields(patient.assessment, dept, subDept)}
        context={patientContext(patient, dept, subDept)}
        onUpdates={u => onChange(u as Partial<AssessmentData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={assessmentAssistFields(patient.assessment, dept, subDept)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<AssessmentData>)}
        />
      </div>

      <div className="flex gap-3">
        <AiBtn onClick={generate} loading={loading} label="Generate Admission Note" />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {result && <DocOutput text={result} onCopy={() => copy(result)} />}
    </div>
  );
}
