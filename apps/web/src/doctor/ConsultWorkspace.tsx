import { useEffect, useState } from 'react';
import {
  cockpitApi,
  type ConsultDetail,
  type ExamFindings,
  type ClinicalPackage,
  type PrescriptionItem,
} from './cockpitApi';

interface Props {
  doctorKey: string;
  consultId: string;
  onBack: () => void;
}

type Tab = 'history' | 'exam' | 'package';

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .split(/\n\n+/)
    .map((b) => (/^<(h[23]|ul|ol|hr|li)/.test(b.trim()) ? b : b.trim() ? `<p>${b.trim()}</p>` : ''))
    .join('\n');
}

const emptyExam: ExamFindings = {
  vitals: {},
  generalInspection: '',
  systemFindings: '',
  freeText: '',
};

const bandColor: Record<string, string> = {
  HIGH: 'bg-red-500',
  MODERATE: 'bg-amber-500',
  LOW: 'bg-gray-400',
};

const priorityColor: Record<string, string> = {
  STAT: 'bg-red-100 text-red-700',
  URGENT: 'bg-amber-100 text-amber-700',
  ROUTINE: 'bg-gray-100 text-gray-600',
};

export function ConsultWorkspace({ doctorKey, consultId, onBack }: Props) {
  const [detail, setDetail] = useState<ConsultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('history');

  const [exam, setExam] = useState<ExamFindings>(emptyExam);
  const [examSaved, setExamSaved] = useState(false);

  const [pkg, setPkg] = useState<ClinicalPackage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await cockpitApi.getConsult(doctorKey, consultId);
        if (!active) return;
        setDetail(d);
        if (d.examFindings) setExam({ ...emptyExam, ...d.examFindings, vitals: { ...d.examFindings.vitals } });
        if (d.clinicalPackage) setPkg(d.clinicalPackage);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load consult');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [doctorKey, consultId]);

  const signed = detail?.consultStatus === 'SIGNED';

  function setVital(field: keyof NonNullable<ExamFindings['vitals']>, value: string) {
    setExam((e) => ({ ...e, vitals: { ...e.vitals, [field]: value } }));
    setExamSaved(false);
  }

  async function handleSaveExam() {
    try {
      const d = await cockpitApi.saveExam(doctorKey, consultId, exam);
      setDetail(d);
      setExamSaved(true);
      setTimeout(() => setExamSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exam');
    }
  }

  async function handleGenerate() {
    setError('');
    setGenerating(true);
    try {
      // Persist any unsaved exam first so the package reflects it.
      await cockpitApi.saveExam(doctorKey, consultId, exam);
      const { package: generated } = await cockpitApi.generatePackage(doctorKey, consultId);
      setPkg(generated);
      const d = await cockpitApi.getConsult(doctorKey, consultId);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate package');
    } finally {
      setGenerating(false);
    }
  }

  function updateRx(i: number, patch: Partial<PrescriptionItem>) {
    setPkg((p) =>
      p ? { ...p, prescriptionDraft: p.prescriptionDraft.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) } : p,
    );
  }
  function removeRx(i: number) {
    setPkg((p) => (p ? { ...p, prescriptionDraft: p.prescriptionDraft.filter((_, idx) => idx !== i) } : p));
  }
  function addRx() {
    const blank: PrescriptionItem = {
      drug: '', strength: '', form: '', dose: '', route: 'PO', frequency: '', duration: '', quantity: '', scheduled: false, caution: '',
    };
    setPkg((p) => (p ? { ...p, prescriptionDraft: [...p.prescriptionDraft, blank] } : p));
  }

  async function handleSign() {
    if (!pkg || !confirmChecked) return;
    setSigning(true);
    try {
      const d = await cockpitApi.confirmPackage(doctorKey, consultId, pkg);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm package');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading consult…</div>;
  }
  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-red-600">{error || 'Consult not found.'}</p>
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline">Back to consults</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1" aria-label="Back">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{detail.chiefComplaint}</div>
            <div className="text-xs text-gray-400">Consultation workspace</div>
          </div>
          <StatusBadge status={detail.consultStatus} />
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-0 border-t border-gray-100">
          {(['history', 'exam', 'package'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'history' ? 'History & Summary' : t === 'exam' ? 'Examination' : 'Clinical Package'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

        {/* HISTORY */}
        {tab === 'history' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-3"><h2 className="text-white font-bold">AI Pre-Consultation Summary</h2></div>
              <div className="p-6">
                {detail.summary ? (
                  <div className="summary-content prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(detail.summary) }} />
                ) : detail.isComplete ? (
                  <p className="text-sm text-gray-500">No summary generated.</p>
                ) : (
                  <p className="text-sm text-amber-600">Patient is still completing their history.</p>
                )}
              </div>
            </div>
            <details className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <summary className="px-6 py-3 text-sm font-semibold text-gray-700 cursor-pointer">Full interview transcript</summary>
              <div className="px-6 pb-5 space-y-2">
                {detail.transcript.map((m, i) => (
                  <div key={i} className={`text-sm ${m.role === 'assistant' ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    <span className="text-xs uppercase tracking-wide mr-2 text-gray-400">{m.role === 'assistant' ? 'AI' : 'Patient'}</span>
                    {m.content}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* EXAM */}
        {tab === 'exam' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Examination findings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enter your findings — these feed the differentials, investigations, and script.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Vitals</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <VitalInput label="BP" placeholder="120/80" value={exam.vitals?.bloodPressure ?? ''} onChange={(v) => setVital('bloodPressure', v)} disabled={signed} />
                <VitalInput label="HR" placeholder="bpm" value={exam.vitals?.heartRate ?? ''} onChange={(v) => setVital('heartRate', v)} disabled={signed} />
                <VitalInput label="RR" placeholder="/min" value={exam.vitals?.respRate ?? ''} onChange={(v) => setVital('respRate', v)} disabled={signed} />
                <VitalInput label="Temp" placeholder="°C" value={exam.vitals?.temperature ?? ''} onChange={(v) => setVital('temperature', v)} disabled={signed} />
                <VitalInput label="SpO₂" placeholder="%" value={exam.vitals?.spo2 ?? ''} onChange={(v) => setVital('spo2', v)} disabled={signed} />
                <VitalInput label="Weight" placeholder="kg" value={exam.vitals?.weight ?? ''} onChange={(v) => setVital('weight', v)} disabled={signed} />
                <VitalInput label="Height" placeholder="cm" value={exam.vitals?.height ?? ''} onChange={(v) => setVital('height', v)} disabled={signed} />
              </div>
            </div>
            <ExamArea label="General inspection" value={exam.generalInspection ?? ''} onChange={(v) => { setExam((e) => ({ ...e, generalInspection: v })); setExamSaved(false); }} disabled={signed} />
            <ExamArea label="System examination findings" value={exam.systemFindings ?? ''} onChange={(v) => { setExam((e) => ({ ...e, systemFindings: v })); setExamSaved(false); }} disabled={signed} placeholder="e.g. Chest: clear; Abdomen: soft, non-tender; CVS: HS I+II+0…" />
            <ExamArea label="Additional notes" value={exam.freeText ?? ''} onChange={(v) => { setExam((e) => ({ ...e, freeText: v })); setExamSaved(false); }} disabled={signed} />
            {!signed && (
              <div className="flex justify-end">
                <button onClick={handleSaveExam} className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
                  {examSaved ? 'Saved ✓' : 'Save findings'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PACKAGE */}
        {tab === 'package' && (
          <div className="space-y-5">
            {!pkg ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <p className="text-sm text-gray-600 mb-1">No clinical package yet.</p>
                <p className="text-xs text-gray-400 mb-5">Generates differentials, investigations, a draft script and sick note from the history + your exam.</p>
                {!detail.isComplete ? (
                  <p className="text-sm text-amber-600">Patient must finish their history first.</p>
                ) : (
                  <button onClick={handleGenerate} disabled={generating} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition">
                    {generating ? 'Generating…' : 'Generate clinical package'}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Disclaimer */}
                <div className={`rounded-xl px-4 py-3 flex items-start gap-3 border ${signed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex-1">
                    {signed ? (
                      <p className="text-sm font-semibold text-green-800">Confirmed &amp; signed by Dr. Patel</p>
                    ) : (
                      <p className="text-sm font-semibold text-amber-800">Draft — review every item before signing</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">{pkg.disclaimer}</p>
                  </div>
                  {!signed && (
                    <button onClick={handleGenerate} disabled={generating} className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition flex-shrink-0">
                      {generating ? '…' : 'Regenerate'}
                    </button>
                  )}
                </div>

                {pkg.redFlags.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-red-700 mb-1">Red flags</p>
                    <ul className="list-disc pl-5 text-sm text-red-700 space-y-0.5">{pkg.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}

                {/* Differentials */}
                <Section title="Differential diagnoses">
                  <div className="space-y-3">
                    {pkg.differentials.map((d, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-sm text-gray-900">{d.diagnosis}</div>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">{d.icd10Code || '—'}</code>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${bandColor[d.band] ?? 'bg-gray-400'}`} style={{ width: `${Math.max(3, d.probability)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-20 text-right">{d.probability}% · {d.band}</span>
                        </div>
                        {d.supportingFeatures.length > 0 && <p className="text-xs text-gray-500 mt-2"><span className="text-green-600 font-medium">For:</span> {d.supportingFeatures.join(', ')}</p>}
                        {d.againstFeatures.length > 0 && <p className="text-xs text-gray-500 mt-0.5"><span className="text-red-600 font-medium">Against:</span> {d.againstFeatures.join(', ')}</p>}
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Investigations */}
                {pkg.recommendedInvestigations.length > 0 && (
                  <Section title="Recommended investigations">
                    <ul className="space-y-2">
                      {pkg.recommendedInvestigations.map((inv, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${priorityColor[inv.priority]}`}>{inv.priority}</span>
                          <span className="text-gray-800"><span className="font-medium">{inv.name}</span> — <span className="text-gray-500">{inv.rationale}</span></span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Management */}
                {pkg.managementPlan.length > 0 && (
                  <Section title="Management considerations">
                    <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">{pkg.managementPlan.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </Section>
                )}

                {/* Prescription */}
                <Section title="Draft prescription">
                  {pkg.prescriptionDraft.length === 0 && <p className="text-sm text-gray-500">No medication proposed.</p>}
                  <div className="space-y-3">
                    {pkg.prescriptionDraft.map((rx, i) => (
                      <div key={i} className={`rounded-xl p-3 border ${rx.scheduled ? 'border-amber-300 bg-amber-50' : 'border-gray-150 bg-gray-50'}`}>
                        {rx.scheduled && <p className="text-xs font-semibold text-amber-700 mb-2">⚠ Scheduled / higher-risk — confirm deliberately{rx.caution ? `: ${rx.caution}` : ''}</p>}
                        {!rx.scheduled && rx.caution && <p className="text-xs text-gray-500 mb-2">Note: {rx.caution}</p>}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <RxField label="Drug" value={rx.drug} onChange={(v) => updateRx(i, { drug: v })} disabled={signed} wide />
                          <RxField label="Strength" value={rx.strength} onChange={(v) => updateRx(i, { strength: v })} disabled={signed} />
                          <RxField label="Form" value={rx.form} onChange={(v) => updateRx(i, { form: v })} disabled={signed} />
                          <RxField label="Dose" value={rx.dose} onChange={(v) => updateRx(i, { dose: v })} disabled={signed} />
                          <RxField label="Route" value={rx.route} onChange={(v) => updateRx(i, { route: v })} disabled={signed} />
                          <RxField label="Frequency" value={rx.frequency} onChange={(v) => updateRx(i, { frequency: v })} disabled={signed} />
                          <RxField label="Duration" value={rx.duration} onChange={(v) => updateRx(i, { duration: v })} disabled={signed} />
                          <RxField label="Quantity" value={rx.quantity} onChange={(v) => updateRx(i, { quantity: v })} disabled={signed} />
                        </div>
                        {!signed && <button onClick={() => removeRx(i)} className="text-xs text-red-500 hover:text-red-700 mt-2">Remove</button>}
                      </div>
                    ))}
                  </div>
                  {!signed && <button onClick={addRx} className="text-xs text-blue-600 hover:underline mt-3">+ Add medication</button>}
                </Section>

                {/* Sick note */}
                <Section title="Sick note">
                  <label className="flex items-center gap-2 text-sm text-gray-800">
                    <input type="checkbox" checked={pkg.sickNote.recommended} disabled={signed} onChange={(e) => setPkg((p) => (p ? { ...p, sickNote: { ...p.sickNote, recommended: e.target.checked } } : p))} />
                    Issue a medical certificate
                  </label>
                  {pkg.sickNote.recommended && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Days off</label>
                        <input type="number" min={0} value={pkg.sickNote.daysOff} disabled={signed} onChange={(e) => setPkg((p) => (p ? { ...p, sickNote: { ...p.sickNote, daysOff: Number(e.target.value) } } : p))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Nature of illness (on certificate)</label>
                        <input type="text" value={pkg.sickNote.natureOfIllness} disabled={signed} onChange={(e) => setPkg((p) => (p ? { ...p, sickNote: { ...p.sickNote, natureOfIllness: e.target.value } } : p))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50" />
                      </div>
                    </div>
                  )}
                </Section>

                {pkg.safetyNetting && (
                  <Section title="Safety netting">
                    <p className="text-sm text-gray-700">{pkg.safetyNetting}</p>
                  </Section>
                )}

                {/* Sign */}
                {!signed ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <label className="flex items-start gap-3 text-sm text-gray-800">
                      <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} className="mt-0.5" />
                      <span>I have reviewed the history, examination, differentials, prescription and certificate above, and confirm they are clinically appropriate for this patient.</span>
                    </label>
                    <button onClick={handleSign} disabled={!confirmChecked || signing} className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold rounded-xl transition">
                      {signing ? 'Signing…' : 'Confirm &amp; sign'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => window.print()} className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition">Print</button>
                    <button onClick={onBack} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">Back to consults</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ConsultDetail['consultStatus'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    TAKING_HISTORY: { label: 'Taking history', cls: 'bg-gray-100 text-gray-600' },
    AWAITING_DOCTOR: { label: 'Awaiting doctor', cls: 'bg-blue-100 text-blue-700' },
    IN_REVIEW: { label: 'In review', cls: 'bg-amber-100 text-amber-700' },
    SIGNED: { label: 'Signed', cls: 'bg-green-100 text-green-700' },
  };
  const s = map[status];
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function VitalInput({ label, value, placeholder, onChange, disabled }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type="text" value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function ExamArea({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <textarea rows={2} value={value} placeholder={placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
    </div>
  );
}

function RxField({ label, value, onChange, disabled, wide }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="block text-[11px] text-gray-500 mb-0.5">{label}</label>
      <input type="text" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 rounded-md border border-gray-200 text-sm disabled:bg-transparent disabled:border-transparent disabled:px-0 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
