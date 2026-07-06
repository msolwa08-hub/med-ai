import { useState } from 'react';
import { toolsApi, type HistorySession, type HistorySummary } from '../toolsApi';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { HistoryData, Patient } from '../fields/types';
import { historyAssistFields } from '../fields/history';
import { patientContext } from '../lib/patientContext';
import { AiBtn, SectionHead, TextInput, copy } from '../components/ui';

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────

export function HistoryTab({ patient, toolsKey, dept, subDept, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<HistoryData>) => void;
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

  return (
    <div className="space-y-5">
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
