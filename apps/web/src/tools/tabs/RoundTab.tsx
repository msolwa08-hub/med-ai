import { useState } from 'react';
import { toolsApi } from '../toolsApi';
import { formatRoundNote } from '../formatDocs';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { Patient, RoundData } from '../fields/types';
import { roundAssistFields } from '../fields/round';
import { patientContext } from '../lib/patientContext';
import { AiBtn, SectionHead, copy } from '../components/ui';

// ─── ROUND TAB ──────────────────────────────────────────────────────────────

export function RoundTab({ patient, toolsKey, dept, subDept, onChange, onLog }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<RoundData>) => void;
  onLog: (note: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const rd = patient.roundData;

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const result = await toolsApi.roundNote(toolsKey, {
        patientName: patient.intake.name || 'Unknown',
        age: patient.intake.age,
        sex: patient.intake.sex,
        ward: patient.intake.ward,
        admissionDiagnosis: patient.intake.admissionDiagnosis,
        dayOfAdmission: parseInt(patient.assessment.dayOfAdmission) || 1,
        subjective: rd.subjective || patient.history.chiefComplaint,
        vitals: patient.assessment.vitals,
        examination: patient.assessment.examination,
        investigations: patient.assessment.investigations,
        problems: patient.problems.map(p => ({
          problem: p.problem,
          workingDx: p.workingDx,
          management: p.management,
        })),
        plan: rd.plan,
        pending: rd.pending,
      });
      onChange({ generatedNote: result });
      onLog(formatRoundNote(result));
    } catch {
      setErr('Failed to generate round note.');
    } finally {
      setLoading(false);
    }
  }

  const noteText = rd.generatedNote ? formatRoundNote(rd.generatedNote) : '';

  return (
    <div className="space-y-5">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        subDept={subDept}
        section="Ward Round"
        fields={roundAssistFields(rd)}
        context={patientContext(patient, dept, subDept)}
        onUpdates={u => onChange(u as Partial<RoundData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={roundAssistFields(rd)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<RoundData>)}
        />
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
        <SectionHead>Daily Round Note</SectionHead>
        <p className="text-gray-500 text-xs mb-4">
          Auto-generated half-page ward round summary (SOAP format, ≤25 lines) from your patient data.
        </p>

        <div className="flex gap-3">
          <AiBtn onClick={generate} loading={loading} label="Generate Ward Round Note" />
          {noteText && (
            <button
              onClick={() => copy(noteText)}
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              Copy
            </button>
          )}
          {noteText && (
            <button
              onClick={() => window.print()}
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              Print
            </button>
          )}
        </div>

        {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
      </div>

      {noteText && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
          <pre className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">
            {noteText}
          </pre>
        </div>
      )}

      {(patient.progressLog?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <SectionHead>Progress ({patient.progressLog!.length} round{patient.progressLog!.length === 1 ? '' : 's'})</SectionHead>
          <div className="space-y-2">
            {[...patient.progressLog!].reverse().map((entry, i) => (
              <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="cursor-pointer px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                  <span>🗓 {entry.date} — round note</span>
                  <span className="text-gray-300 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                  {entry.note}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
