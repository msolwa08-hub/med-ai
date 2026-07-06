import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { IntakeData, Patient } from '../fields/types';
import { intakeAssistFields } from '../fields/intake';
import { patientContext } from '../lib/patientContext';
import { SectionHead } from '../components/ui';

// ─── INTAKE TAB ─────────────────────────────────────────────────────────────

export function IntakeTab({ patient, toolsKey, dept, subDept, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<IntakeData>) => void;
}) {
  const d = patient.intake;
  const fields = intakeAssistFields(d, dept);

  return (
    <div className="space-y-6">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        subDept={subDept}
        section="Intake"
        fields={fields}
        context={patientContext(patient, dept, subDept)}
        onUpdates={u => onChange(u as Partial<IntakeData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList fields={fields} onEdit={(key, value) => onChange({ [key]: value })} />
      </div>
    </div>
  );
}
