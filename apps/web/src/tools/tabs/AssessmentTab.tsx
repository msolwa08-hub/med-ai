import { useState } from 'react';
import { toolsApi } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { AssessmentData, Patient } from '../fields/types';
import { assessmentAssistFields } from '../fields/assessment';
import { patientContext } from '../lib/patientContext';
import { AiBtn, DocOutput, SectionHead, copy } from '../components/ui';

// ─── ASSESSMENT TAB ──────────────────────────────────────────────────────────

export function AssessmentTab({ patient, toolsKey, dept, subDept, onChange, onAdmNote }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<AssessmentData>) => void;
  onAdmNote: (note: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(patient.admissionNote ?? '');
  const [err, setErr] = useState('');

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
