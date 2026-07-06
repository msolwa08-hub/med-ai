import { useState } from 'react';
import { toolsApi, type HistorySession, type HistorySummary } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { HistoryData, Patient } from '../fields/types';
import { historyAssistFields } from '../fields/history';
import { patientContext } from '../lib/patientContext';
import { AiBtn, SectionHead, TextInput, copy } from '../components/ui';
import { cascadesFor, type SymptomCascade } from '../config/symptomCascades';
import { smartBlocksFor, type SmartBlock } from '../config/smartBlocks';
import { CascadePanel, EMPTY_CASCADE_VALUE, type CascadePanelValue } from '../components/CascadePanel';
import { SmartBlockCard, EMPTY_SMART_BLOCK_VALUE, type SmartBlockValue } from '../components/SmartBlockCard';
import { upsertSerialized } from '../lib/serializeIntoField';

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────

// Acute-presentation smart blocks serialize into the presenting illness; the
// rest describe chronic disease/logistics and belong in past medical history.
const HPI_SMART_BLOCKS = new Set(['neonatal-jaundice', 'pprom-ptl']);

/** Everything the record says so far, for smart-block trigger matching. */
function fullRecordText(patient: Patient, dept: DeptId, subDept?: string): string {
  const vals = (o: Record<string, unknown>) =>
    Object.values(o).filter((v): v is string => typeof v === 'string');
  return [dept, subDept ?? '', ...vals(patient.intake), ...vals(patient.history), ...vals(patient.assessment)].join(' ');
}

export function HistoryTab({ patient, toolsKey, dept, subDept, onChange, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<HistoryData>) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [starting, setStarting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [histSession, setHistSession] = useState<HistorySession | null>(null);
  const [histSummary, setHistSummary] = useState<HistorySummary | null>(null);
  const [importId, setImportId] = useState(patient.history.importedSessionId ?? '');
  const [err, setErr] = useState('');

  const ageSex = `${patient.intake.age} ${patient.intake.sex}`.trim();

  async function startHistory() {
    setStarting(true);
    setErr('');
    try {
      const result = await toolsApi.startHistory(toolsKey, {
        department: dept,
        ageSex: ageSex || undefined,
        chiefComplaintHint: patient.intake.admissionDiagnosis || undefined,
      });
      setHistSession(result);
      onChange({ importedSessionId: result.sessionId });
    } catch (e) {
      setErr('Failed to start history session.');
    } finally {
      setStarting(false);
    }
  }

  async function importHistory() {
    const sid = importId || patient.history.importedSessionId;
    if (!sid) return;
    setImporting(true);
    setErr('');
    try {
      const result = await toolsApi.importHistory(toolsKey, sid);
      setHistSummary(result);
      if (result.summary) onChange({ importedSummary: result.summary });
      if (result.history) onChange({ hpi: result.history });
      if (result.complaints?.length) onChange({ chiefComplaint: result.complaints.join(', ') });
    } catch {
      setErr('Failed to import history. Check the session ID.');
    } finally {
      setImporting(false);
    }
  }

  const patientUrl = histSession?.patientUrl
    ? `${window.location.origin}${histSession.patientUrl}`
    : null;

  // ── Presenting complaint cascade (zero-typing) ─────────────────────────────
  const cascades = cascadesFor(dept);
  const activeCascade: SymptomCascade | undefined = cascades.find(c => c.id === patient.activeCascadeId);
  const isFemale = /^f/i.test(patient.intake.sex.trim());

  function cascadeChanged(cascade: SymptomCascade, v: CascadePanelValue, serialized: string) {
    const persist = patient.cascades?.[cascade.id];
    // The serialized shorthand IS the chief complaint — replace what this
    // cascade last wrote, preserve anything else in the field.
    const nextCC = upsertSerialized(patient.history.chiefComplaint, persist?.lastText, serialized, '; ');
    onChange({ chiefComplaint: nextCC });
    onPatient({
      cascades: { ...patient.cascades, [cascade.id]: { ...v, lastText: serialized } },
    });
  }

  // ── Condition-triggered smart blocks ───────────────────────────────────────
  const matchedBlocks = smartBlocksFor(fullRecordText(patient, dept, subDept));

  function smartBlockChanged(block: SmartBlock, v: SmartBlockValue, serialized: string) {
    const persist = patient.smartBlocks?.[block.id];
    const target = HPI_SMART_BLOCKS.has(block.id) ? 'hpi' : 'pmh';
    const nextField = upsertSerialized(patient.history[target] ?? '', persist?.lastText, serialized, '\n');
    onChange({ [target]: nextField });
    onPatient({
      smartBlocks: { ...patient.smartBlocks, [block.id]: { ...v, lastText: serialized } },
    });
  }

  return (
    <div className="space-y-5">
      {/* Presenting complaint — chip-first, zero typing */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
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
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : answered
                      ? 'bg-teal-50 border-teal-200 text-teal-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                {c.icon ? `${c.icon} ` : ''}{c.label}{answered && !on ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
        {activeCascade && (
          <div className="border-t border-gray-50 pt-4">
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
          <p className="text-[13px] text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5 leading-relaxed">
            <span className="text-gray-400">→ </span>{patient.history.chiefComplaint}
          </p>
        )}
      </div>

      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        subDept={subDept}
        section="History"
        fields={historyAssistFields(patient.history, dept, subDept)}
        context={patientContext(patient, dept, subDept)}
        onUpdates={u => onChange(u as Partial<HistoryData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={historyAssistFields(patient.history, dept, subDept)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<HistoryData>)}
        />
      </div>

      {/* Condition-triggered smart blocks — STG-aligned granular capture */}
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

      {/* AI History Section */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
        <SectionHead>AI-Assisted History Taking</SectionHead>
        <p className="text-gray-500 text-xs mb-4">
          Start an AI session for the patient to complete their history. Share the link, then import when done.
        </p>

        <div className="flex gap-3 mb-4">
          <AiBtn onClick={startHistory} loading={starting} label="Start Patient Session" />
        </div>

        {patientUrl && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
            <p className="text-xs text-gray-500 mb-1">Share this link with the patient:</p>
            <div className="flex items-center gap-2">
              <code className="text-teal-700 text-xs flex-1 break-all">{patientUrl}</code>
              <button
                onClick={() => copy(patientUrl)}
                className="text-xs text-gray-500 hover:text-gray-900 shrink-0 bg-gray-100 px-2 py-1 rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">Import completed history by session ID:</p>
          <div className="flex gap-2">
            <TextInput
              value={importId}
              onChange={setImportId}
              placeholder="Session ID (auto-filled if started above)"
            />
            <button
              onClick={importHistory}
              disabled={importing || !importId}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shrink-0"
            >
              {importing ? '...' : 'Import'}
            </button>
          </div>
        </div>

        {err && <p className="text-red-400 text-xs mt-2">{err}</p>}

        {histSummary && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              {histSummary.completed ? '✓ History imported' : '⏳ Session in progress'}
            </p>
            {histSummary.summary && (
              <p className="text-xs text-gray-600 leading-relaxed">{histSummary.summary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
