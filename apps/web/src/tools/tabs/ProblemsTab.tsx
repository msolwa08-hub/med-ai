import { useState } from 'react';
import { toolsApi, type Problem, type SafetyWarning } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { uid } from '../lib/patient';
import { AiBtn, Label, SectionHead, TextArea, TextInput } from '../components/ui';

// ─── PROBLEMS TAB ────────────────────────────────────────────────────────────

function SafetyBanner({ warnings }: { warnings: SafetyWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-2">
      <SectionHead>Medication Safety</SectionHead>
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`text-[13px] rounded-xl px-4 py-2.5 border ${
            w.severity === 'BLOCK'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="font-semibold">{w.severity === 'BLOCK' ? '⛔' : '⚠️'} {w.drug}</span>
          <span className="text-[11px] uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
          <p className="mt-0.5 leading-relaxed">{w.reason}</p>
        </div>
      ))}
    </div>
  );
}

export function ProblemsTab({ patient, toolsKey, dept, problems, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  problems: Problem[];
  onChange: (problems: Problem[]) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [warnings, setWarnings] = useState<SafetyWarning[]>([]);
  const [aiNote, setAiNote] = useState('');
  const [err, setErr] = useState('');

  async function suggest() {
    setSuggesting(true);
    setErr('');
    try {
      const res = await toolsApi.suggestProblems(toolsKey, {
        dept,
        intake: patient.intake,
        history: patient.history,
        assessment: patient.assessment,
      });
      // Don't duplicate problems already on the list — re-clicking Suggest
      // should refine, not multiply.
      const existing = new Set(problems.map(p => p.problem.trim().toLowerCase()));
      const suggested: Problem[] = res.problems
        .filter(p => !existing.has(p.problem.trim().toLowerCase()))
        .map(p => ({
          id: uid(),
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
          status: 'active',
          icd10: p.icd10,
          stgCondition: p.stgCondition,
          protocolTitle: p.protocolTitle,
        }));
      onChange([...problems, ...suggested]);
      setWarnings(res.safety);
      setAiNote(
        suggested.length === 0 && res.problems.length > 0
          ? 'No new problems — the suggestions matched what is already on the list.'
          : res.note
      );
    } catch {
      setErr('Could not generate the problem list — check the record has enough detail, or add problems manually.');
    } finally {
      setSuggesting(false);
    }
  }

  async function checkInteractions() {
    setChecking(true);
    setErr('');
    try {
      const res = await toolsApi.interactionCheck(toolsKey, {
        medicationsText: patient.history.medications,
        allergiesText: patient.intake.allergies,
        plannedLines: problems.flatMap(p => p.management),
        problemCodes: problems.map(p => p.icd10 ?? ''),
      });
      setWarnings(res.warnings);
      if (res.warnings.length === 0) {
        setAiNote(`No interactions found across ${res.medCount} current medication${res.medCount === 1 ? '' : 's'} and the planned management.`);
      }
    } catch {
      setErr('Interaction check failed.');
    } finally {
      setChecking(false);
    }
  }

  function addProblem() {
    onChange([
      ...problems,
      {
        id: uid(),
        problem: '',
        workingDx: '',
        differentials: [],
        management: [],
        status: 'active',
      },
    ]);
  }

  function updateProblem(id: string, patch: Partial<Problem>) {
    onChange(problems.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeProblem(id: string) {
    onChange(problems.filter(p => p.id !== id));
  }

  const statusColors: Record<string, string> = {
    active: 'bg-red-100 text-red-700',
    resolving: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <SectionHead>Problem List</SectionHead>
        <div className="flex items-center gap-3">
          <AiBtn onClick={suggest} loading={suggesting} label="Suggest from assessment" />
          <button
            onClick={checkInteractions}
            disabled={checking}
            className="text-[13px] bg-gray-50 hover:bg-amber-50 disabled:opacity-40 text-amber-700 px-3.5 py-2 rounded-full font-medium transition-colors"
          >
            {checking ? 'Checking…' : '⚠️ Check interactions'}
          </button>
          <button
            onClick={addProblem}
            className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
          >
            + Add Problem
          </button>
        </div>
      </div>

      {err && <p className="text-red-500 text-xs">{err}</p>}
      {aiNote && (
        <p className="text-[13px] text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
          {aiNote}
        </p>
      )}
      <SafetyBanner warnings={warnings} />

      {problems.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No problems added yet</p>
          <p className="text-xs mt-1">"Suggest from assessment" builds one from the record — or add problems manually</p>
        </div>
      )}

      {problems.map((p, idx) => (
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 text-sm font-mono mt-2 shrink-0">{idx + 1}.</span>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Problem</Label>
                  <TextInput
                    value={p.problem}
                    onChange={v => updateProblem(p.id, { problem: v })}
                    placeholder="e.g. Chest pain, fever, hyponatraemia"
                  />
                </div>
                <div className="w-32">
                  <Label>Status</Label>
                  <select
                    value={p.status}
                    onChange={e => updateProblem(p.id, { status: e.target.value as Problem['status'] })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="resolving">Resolving</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Working Diagnosis</Label>
                <TextInput
                  value={p.workingDx}
                  onChange={v => updateProblem(p.id, { workingDx: v })}
                  placeholder="Most likely diagnosis"
                />
              </div>

              <div>
                <Label>Differentials (comma-separated)</Label>
                <TextInput
                  value={p.differentials.join(', ')}
                  onChange={v => updateProblem(p.id, { differentials: v.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. ACS, PE, aortic dissection"
                />
                {p.differentials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.differentials.map((d, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Management Plan (one item per line)</Label>
                <TextArea
                  value={p.management.join('\n')}
                  onChange={v => updateProblem(p.id, { management: v.split('\n').filter(Boolean) })}
                  placeholder="e.g. IV morphine 2mg q4h prn&#10;Serial ECGs&#10;Troponin in 6h"
                  rows={3}
                />
                {p.management.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {p.management.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <input type="checkbox" className="mt-0.5 accent-blue-500" />
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => removeProblem(p.id)}
              className="text-gray-400 hover:text-red-400 transition-colors text-lg shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
              {p.status}
            </span>
            {p.stgCondition && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100"
                title="Management anchored to this SA Standard Treatment Guideline entry"
              >
                📖 STG: {p.stgCondition}{p.icd10 ? ` · ${p.icd10}` : ''}
              </span>
            )}
            {p.protocolTitle && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                title="Management follows this facility's own uploaded protocol — overrides the generic STG where they differ"
              >
                🏥 {p.protocolTitle}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
