import { useState } from 'react';
import { toolsApi, type WardRoundDeltaResponse, type WardRoundUpdate } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { patientContext } from '../lib/patientContext';
import { serializeLatestResults } from '../lib/investigations';
import { AiBtn, copy, stripMarkdown } from '../components/ui';

// ─── ROUND & HANDOVER TAB ────────────────────────────────────────────────────
// Deliberately just two outputs — the daily ward-round note and the consultant
// presentation — in large, paper-ready type. Per the ward brief, everything else
// (delta cards, screening lists, saved-round accordions, a second assist panel,
// raw detail dumps) is clutter here; the clerking already captured it. This tab
// exists to produce the two documents the intern actually hands over.

// The single most important surface in the app: the finished note the intern
// reads to the consultant / copies onto the chart. Big type, generous leading,
// clean print. This is the "make the important information bigger" fix.
function HandoverSheet({ title, text, onPrint }: { title: string; text: string; onPrint: () => void }) {
  const clean = stripMarkdown(text);
  return (
    <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 print:hidden">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <div className="flex items-center gap-4">
          <button onClick={() => copy(clean)} className="text-sm text-teal-700 hover:text-teal-900 font-medium">Copy</button>
          <button onClick={onPrint} className="text-sm text-gray-600 hover:text-gray-900 font-medium">Print</button>
        </div>
      </div>
      <pre className="text-[17px] sm:text-lg text-gray-900 whitespace-pre-wrap leading-[1.7] px-5 sm:px-7 py-6 font-sans tracking-normal">
        {clean}
      </pre>
    </div>
  );
}

// Compose the delta engine's structured response into ONE plain-text ward-round
// note. The expected-vs-actual synthesis (the improved "work structure") is kept
// — it is just rendered as a single readable sheet, not a wall of cards.
function composeRound(d: WardRoundDeltaResponse): string {
  const lines: string[] = [];
  lines.push(`DAILY WARD ROUND — ${d.date}`);
  lines.push('');
  if (d.onHistory?.trim()) { lines.push('SUBJECTIVE'); lines.push(d.onHistory.trim()); lines.push(''); }
  if (d.onExamination?.trim()) { lines.push('OBJECTIVE / EXAM'); lines.push(d.onExamination.trim()); lines.push(''); }
  if (d.examsToRepeatToday?.length) {
    lines.push('EXAMS TO REPEAT TODAY');
    d.examsToRepeatToday.forEach(e => lines.push(`• ${e}`));
    lines.push('');
  }
  if (d.suggestedInvestigations?.length) {
    lines.push('INVESTIGATIONS');
    d.suggestedInvestigations.forEach(i => lines.push(`• ${i}`));
    lines.push('');
  }
  if (d.suggestedManagement?.length) {
    lines.push('PLAN');
    d.suggestedManagement.forEach((m, i) => lines.push(`${i + 1}. ${m}`));
    lines.push('');
  }
  if (d.consultantLogicExplanation?.trim()) {
    lines.push('REASONING');
    lines.push(d.consultantLogicExplanation.trim());
  }
  return lines.join('\n').trim();
}

const TODAY_INPUTS: { key: 'todaySubjective' | 'todayObjective' | 'todayVitals' | 'newResults'; label: string; placeholder: string }[] = [
  { key: 'todaySubjective', label: 'Overnight / subjective', placeholder: 'How the night went' },
  { key: 'todayObjective', label: 'On examination today', placeholder: 'What you found this morning' },
  { key: 'todayVitals', label: 'Vitals', placeholder: 'BP, HR, RR, temp, sats' },
  { key: 'newResults', label: 'New results', placeholder: 'Overnight bloods, imaging' },
];

export function RoundTab({ patient, toolsKey, dept, subDept, onLog, onPatient }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  subDept?: string;
  onLog: (note: string) => void;
  onPatient: (patch: Partial<Patient>) => void;
}) {
  const [today, setToday] = useState({ todaySubjective: '', todayObjective: '', todayVitals: '', newResults: '' });

  const [roundLoading, setRoundLoading] = useState(false);
  const [roundText, setRoundText] = useState('');
  const [roundSafety, setRoundSafety] = useState<WardRoundDeltaResponse['safety']>([]);
  const [roundErr, setRoundErr] = useState('');

  const [presLoading, setPresLoading] = useState(false);
  const [presText, setPresText] = useState('');
  const [presErr, setPresErr] = useState('');

  const [printing, setPrinting] = useState<'round' | 'presentation' | null>(null);
  function printSheet(which: 'round' | 'presentation') {
    setPrinting(which);
    setTimeout(() => { window.print(); setPrinting(null); }, 50);
  }

  async function generateRound() {
    setRoundLoading(true);
    setRoundErr('');
    try {
      const res = await toolsApi.wardRoundDelta(toolsKey, {
        dept,
        subDept,
        patientContext: patientContext(patient, dept, subDept),
        problems: patient.problems
          .map(p => [p.problem, p.workingDx].filter(Boolean).join(' — '))
          .filter(Boolean),
        history: [patient.history.chiefComplaint, patient.history.hpi].filter(Boolean).join(' — ') || undefined,
        generalExam: patient.assessment.generalExam || undefined,
        focusedExam: patient.assessment.examination || undefined,
        medications: patient.history.medications || undefined,
        allergies: patient.intake.allergies || undefined,
        previousRounds: patient.rounds ?? [],
        todaySubjective: today.todaySubjective || undefined,
        todayObjective: today.todayObjective || undefined,
        vitals: today.todayVitals || patient.assessment.vitals || undefined,
        newResults: [serializeLatestResults(patient.investigations ?? []), today.newResults].filter(Boolean).join('. ') || undefined,
        imageFindings: patient.imageFindings?.map(f => `${f.date} ${f.modality.toUpperCase()}: ${f.injectText}`),
      });
      const text = composeRound(res);
      setRoundText(text);
      setRoundSafety(res.safety ?? []);
      // Persist silently so the trajectory feeds the next round — no accordion,
      // just a quiet one-line count.
      const entry: WardRoundUpdate = {
        date: res.date || new Date().toISOString().slice(0, 10),
        onHistory: res.onHistory,
        onExamination: res.onExamination,
        examsToRepeatToday: res.examsToRepeatToday ?? [],
        suggestedInvestigations: res.suggestedInvestigations,
        suggestedManagement: res.suggestedManagement,
        consultantLogicExplanation: res.consultantLogicExplanation,
      };
      onPatient({ rounds: [...(patient.rounds ?? []), entry] });
      onLog(stripMarkdown(text));
    } catch {
      setRoundErr('Could not generate the round — add today’s findings or check the record, then try again.');
    } finally {
      setRoundLoading(false);
    }
  }

  async function generatePresentation() {
    setPresLoading(true);
    setPresErr('');
    try {
      const r = await toolsApi.presentPatient(toolsKey, {
        dept,
        subDept,
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        problems: patient.problems.map(p => ({
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
        })),
      });
      setPresText(`${r.oneLineSummary}\n\n${r.presentation}`);
    } catch {
      setPresErr('Could not generate the presentation — try again in a moment.');
    } finally {
      setPresLoading(false);
    }
  }

  const roundsOnRecord = patient.rounds?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* ── Daily Ward Round ── */}
      <section className={printing === 'presentation' ? 'print:hidden' : ''}>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Ward Round</h2>
        <p className="text-gray-500 text-sm mt-1 mb-4 print:hidden">
          The note you write on the chart each day. Add today’s findings, generate, copy or print.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 print:hidden">
          {TODAY_INPUTS.map(f => (
            <div key={f.key}>
              <p className="text-sm font-medium text-gray-600 mb-1">{f.label}</p>
              <textarea
                value={today[f.key]}
                onChange={e => setToday(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-4 print:hidden">
          <AiBtn onClick={generateRound} loading={roundLoading} label="Generate ward round" />
          {roundsOnRecord > 0 && (
            <span className="text-sm text-gray-500">{roundsOnRecord} previous round{roundsOnRecord === 1 ? '' : 's'} on record</span>
          )}
        </div>
        {roundErr && <p className="text-red-500 text-sm mt-2 print:hidden">{roundErr}</p>}

        {roundSafety.length > 0 && (
          <div className="space-y-2 mt-4 print:hidden">
            {roundSafety.map((w, i) => (
              <div
                key={i}
                className={`text-[15px] rounded-xl px-4 py-3 border ${
                  w.severity === 'BLOCK' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="font-semibold">{w.severity === 'BLOCK' ? '⛔' : '⚠️'} {w.drug}</span>
                <span className="text-xs uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
                <p className="mt-0.5 leading-relaxed">{w.reason}</p>
              </div>
            ))}
          </div>
        )}

        {roundText && <HandoverSheet title="Ward round note" text={roundText} onPrint={() => printSheet('round')} />}
      </section>

      {/* ── Consultant Presentation ── */}
      <section className={printing === 'round' ? 'print:hidden' : ''}>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Consultant Presentation</h2>
        <p className="text-gray-500 text-sm mt-1 mb-4 print:hidden">
          The spoken SBAR hand-over you present on the round. Generates from the record — usable at any point.
        </p>
        <div className="flex items-center gap-3 print:hidden">
          <AiBtn onClick={generatePresentation} loading={presLoading} label="Generate presentation" />
        </div>
        {presErr && <p className="text-red-500 text-sm mt-2 print:hidden">{presErr}</p>}
        {presText && <HandoverSheet title="Consultant presentation" text={presText} onPrint={() => printSheet('presentation')} />}
      </section>
    </div>
  );
}
