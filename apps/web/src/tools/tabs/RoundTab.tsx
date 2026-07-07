import { useState } from 'react';
import { toolsApi, type WardRoundDeltaResponse, type WardRoundUpdate } from '../toolsApi';
import { formatRoundNote } from '../formatDocs';
import { AssistPanel } from '../AssistPanel';
import { DetailsList } from '../DetailsList';
import type { DeptId } from '../config/departments';
import type { Patient, RoundData } from '../fields/types';
import { roundAssistFields } from '../fields/round';
import { patientContext } from '../lib/patientContext';
import { serializeLatestResults } from '../lib/investigations';
import { AiBtn, SectionHead, copy } from '../components/ui';
import { WhyButton } from '../components/WhyButton';

// ─── ROUND TAB ──────────────────────────────────────────────────────────────

// One crisp, copyable synthesis block ("On History", "Management", …).
function DeltaBlock({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 pt-2.5">
        <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">{title}</p>
        <button
          onClick={() => copy(text)}
          className="text-xs text-gray-400 hover:text-gray-900 transition-colors min-h-[44px] px-2"
        >
          Copy
        </button>
      </div>
      <pre className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed px-3.5 pb-3 font-sans">{text}</pre>
    </div>
  );
}

const HOD_INPUTS: { key: 'todaySubjective' | 'todayObjective' | 'todayVitals' | 'newResults'; label: string; placeholder: string }[] = [
  { key: 'todaySubjective', label: 'Today — subjective', placeholder: 'How the patient says the night went' },
  { key: 'todayObjective', label: 'Today — objective', placeholder: 'What you found on examining this morning' },
  { key: 'todayVitals', label: 'Vitals', placeholder: 'BP, HR, RR, temp, sats' },
  { key: 'newResults', label: 'New results', placeholder: 'Overnight bloods, imaging, cultures' },
];

export function RoundTab({ patient, toolsKey, dept, subDept, onChange, onLog, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onChange: (patch: Partial<RoundData>) => void;
  onLog: (note: string) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const rd = patient.roundData;

  // ── HOD Round — delta synthesis over the saved round history ───────────────
  const [today, setToday] = useState({ todaySubjective: '', todayObjective: '', todayVitals: '', newResults: '' });
  const [deltaLoading, setDeltaLoading] = useState(false);
  const [deltaErr, setDeltaErr] = useState('');
  const [delta, setDelta] = useState<WardRoundDeltaResponse | null>(null);
  const [deltaSaved, setDeltaSaved] = useState(false);

  async function synthesize() {
    setDeltaLoading(true);
    setDeltaErr('');
    setDeltaSaved(false);
    try {
      const res = await toolsApi.wardRoundDelta(toolsKey, {
        dept,
        subDept,
        patientContext: patientContext(patient, dept, subDept),
        problems: patient.problems
          .map(p => [p.problem, p.workingDx].filter(Boolean).join(' — '))
          .filter(Boolean),
        // The history + baseline exam are what the round synthesises
        // expected-vs-actual findings against.
        history: [patient.history.chiefComplaint, patient.history.hpi]
          .filter(Boolean).join(' — ') || undefined,
        generalExam: patient.assessment.generalExam || undefined,
        focusedExam: patient.assessment.examination || undefined,
        medications: patient.history.medications || undefined,
        allergies: patient.intake.allergies || undefined,
        previousRounds: patient.rounds ?? [],
        todaySubjective: today.todaySubjective || undefined,
        todayObjective: today.todayObjective || undefined,
        vitals: today.todayVitals || patient.assessment.vitals || undefined,
        // Fold the trended serial results into the round automatically — the
        // manually-typed box is additive on top of what the Results tab holds.
        newResults: [serializeLatestResults(patient.investigations ?? []), today.newResults]
          .filter(Boolean)
          .join('. ') || undefined,
        imageFindings: patient.imageFindings?.map(f => `${f.date} ${f.modality.toUpperCase()}: ${f.injectText}`),
      });
      setDelta(res);
    } catch {
      setDeltaErr('Could not synthesize the round — check the record has enough detail and try again.');
    } finally {
      setDeltaLoading(false);
    }
  }

  function saveRound() {
    if (!delta) return;
    const entry: WardRoundUpdate = {
      date: delta.date || new Date().toISOString().slice(0, 10),
      onHistory: delta.onHistory,
      onExamination: delta.onExamination,
      suggestedInvestigations: delta.suggestedInvestigations,
      suggestedManagement: delta.suggestedManagement,
      consultantLogicExplanation: delta.consultantLogicExplanation,
    };
    onPatient({ rounds: [...(patient.rounds ?? []), entry] });
    setDeltaSaved(true);
  }

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
      {/* HOD Round — synthesized against previous rounds, presented in the
          order a consultant asks for it */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
        <SectionHead>HOD Round</SectionHead>
        <div className="grid sm:grid-cols-2 gap-3">
          {HOD_INPUTS.map(f => (
            <div key={f.key}>
              <p className="text-xs font-medium text-gray-500 mb-1">{f.label}</p>
              <textarea
                value={today[f.key]}
                onChange={e => setToday(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AiBtn onClick={synthesize} loading={deltaLoading} label="Synthesize round" />
          {(patient.rounds?.length ?? 0) > 0 && (
            <span className="text-xs text-gray-400">
              {patient.rounds!.length} previous round{patient.rounds!.length === 1 ? '' : 's'} on record
            </span>
          )}
        </div>
        {deltaErr && <p className="text-red-500 text-xs">{deltaErr}</p>}

        {delta && (
          <div className="space-y-3">
            {delta.safety.length > 0 && (
              <div className="space-y-1.5">
                {delta.safety.map((w, i) => (
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
            )}

            <DeltaBlock title="On History" text={delta.onHistory} />
            <DeltaBlock title="On Examination" text={delta.onExamination} />
            <DeltaBlock title="Investigations" text={delta.suggestedInvestigations.map(s => `• ${s}`).join('\n')} />
            <DeltaBlock title="Management" text={delta.suggestedManagement.map(s => `• ${s}`).join('\n')} />

            {delta.screening.length > 0 && (
              <div className="space-y-1.5">
                {delta.screening.map((s, i) => (
                  <div key={i} className="bg-teal-50/60 border border-teal-100 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wide font-semibold rounded-full px-2 py-0.5 bg-teal-100 text-teal-800">
                        {s.category}
                      </span>
                      <span className="text-[13px] font-medium text-gray-800">{s.trigger}</span>
                      <WhyButton why={s.why} />
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {s.prompts.map((p, j) => (
                        <li key={j} className="text-[13px] text-gray-700 flex gap-2">
                          <span className="text-teal-400 shrink-0">•</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={saveRound}
                disabled={deltaSaved}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors ${
                  deltaSaved
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                }`}
              >
                {deltaSaved ? '✓ Round saved' : 'Save round'}
              </button>
              <WhyButton why={delta.consultantLogicExplanation} />
            </div>
          </div>
        )}

        {(patient.rounds?.length ?? 0) > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Saved rounds</p>
            <div className="space-y-1">
              {[...patient.rounds!].reverse().map((r, i) => (
                <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                  <summary className="cursor-pointer px-3.5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center justify-between min-h-[44px]">
                    <span>🗓 {r.date}</span>
                    <span className="text-gray-300 group-open:rotate-90 transition-transform">›</span>
                  </summary>
                  <div className="px-3.5 py-3 border-t border-gray-100 bg-gray-50/60 space-y-1">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed"><span className="font-semibold">Hx:</span> {r.onHistory}</p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed"><span className="font-semibold">O/E:</span> {r.onExamination}</p>
                    {r.suggestedInvestigations.length > 0 && (
                      <p className="text-xs text-gray-700 leading-relaxed"><span className="font-semibold">Ix:</span> {r.suggestedInvestigations.join('; ')}</p>
                    )}
                    {r.suggestedManagement.length > 0 && (
                      <p className="text-xs text-gray-700 leading-relaxed"><span className="font-semibold">Mx:</span> {r.suggestedManagement.join('; ')}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

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
