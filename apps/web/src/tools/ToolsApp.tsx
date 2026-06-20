import { useEffect, useState } from 'react';
import {
  toolsApi, toolsKeyStore,
  type AdmissionNote, type LabInterpretation, type PatientPresentation,
  type WardNote, type DischargeSummary,
} from './toolsApi';
import { formatDischarge, formatWardNote } from './formatDocs';

// ─── Data model ──────────────────────────────────────────────────────────────

const ROTATIONS = [
  'General Medicine', 'Surgery', 'Paediatrics', 'Obs/Gyn',
  'Psychiatry', 'ICU', 'Emergency', 'Family Medicine', 'Orthopaedics', 'Other',
] as const;
type Rotation = typeof ROTATIONS[number];

interface AdmissionData {
  chiefComplaint: string; hpi: string; pmh: string; medications: string;
  allergies: string; familyHistory: string; socialHistory: string; ros: string;
  examination: string; investigations: string; workingDiagnosis: string; managementPlan: string;
  aiNote: AdmissionNote | null;
}

interface ProgressNote {
  id: string; date: string; hospitalDay: string;
  narrative: string; labResults: string; aiNote: WardNote | null;
}

interface LabEntry {
  id: string; date: string; rawResults: string; interpretation: LabInterpretation | null;
}

interface DiagnosisItem {
  id: string; name: string; icd10: string;
  type: 'PRIMARY' | 'SECONDARY' | 'COMPLICATION';
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
}

interface ManagementItem {
  id: string; problem: string; plan: string; status: 'ACTIVE' | 'RESOLVED';
}

interface Patient {
  id: string; name: string; ageSex: string; hospitalNumber: string;
  ward: string; admissionDate: string; dischargeDate: string; status: 'ADMITTED' | 'DISCHARGED';
  rotation: string; admission: AdmissionData;
  progressNotes: ProgressNote[]; labs: LabEntry[];
  diagnoses: DiagnosisItem[]; management: ManagementItem[];
  dischargeSummary: DischargeSummary | null; presentation: PatientPresentation | null;
}

type Tab = 'admission' | 'notes' | 'labs' | 'diagnosis' | 'formulas' | 'present';

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORE = 'intern_patients_v3';
const ROT_KEY = 'intern_rotation';
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split('T')[0];

function loadPts(): Patient[] {
  try { return JSON.parse(localStorage.getItem(STORE) ?? '[]'); } catch { return []; }
}
function savePts(p: Patient[]) { localStorage.setItem(STORE, JSON.stringify(p)); }
function loadRot(): Rotation { return (localStorage.getItem(ROT_KEY) as Rotation) ?? 'General Medicine'; }
function saveRot(r: Rotation) { localStorage.setItem(ROT_KEY, r); }

function emptyAdmission(): AdmissionData {
  return { chiefComplaint: '', hpi: '', pmh: '', medications: '', allergies: '',
    familyHistory: '', socialHistory: '', ros: '', examination: '', investigations: '',
    workingDiagnosis: '', managementPlan: '', aiNote: null };
}
function newPatient(rotation: string): Patient {
  return { id: uid(), name: '', ageSex: '', hospitalNumber: '', ward: '', admissionDate: today(), dischargeDate: '',
    status: 'ADMITTED', rotation, admission: emptyAdmission(),
    progressNotes: [], labs: [], diagnoses: [], management: [], dischargeSummary: null, presentation: null };
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type View = 'gate' | 'list' | 'patient';

export default function ToolsApp() {
  const [view, setView] = useState<View>('gate');
  const [toolsKey, setToolsKey] = useState<string | null>(null);
  const [rotation, setRotation] = useState<Rotation>('General Medicine');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const k = toolsKeyStore.get();
    if (k) { setToolsKey(k); setPatients(loadPts()); setRotation(loadRot()); setView('list'); }
    setLoading(false);
  }, []);

  function updatePatient(updated: Patient) {
    setPatients((prev) => { const next = prev.map((p) => p.id === updated.id ? updated : p); savePts(next); return next; });
  }
  function addPatient(p: Patient) {
    setPatients((prev) => { const next = [p, ...prev]; savePts(next); return next; });
  }
  function removePatient(id: string) {
    setPatients((prev) => { const next = prev.filter((p) => p.id !== id); savePts(next); return next; });
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;

  if (view === 'gate' || !toolsKey) {
    return (
      <ToolsGate
        onValidated={(k, rot) => {
          toolsKeyStore.set(k); setToolsKey(k);
          saveRot(rot); setRotation(rot);
          setPatients(loadPts()); setView('list');
        }}
      />
    );
  }

  if (view === 'patient' && selectedId) {
    const pt = patients.find((p) => p.id === selectedId);
    if (pt) {
      return (
        <PatientWorkspace
          toolsKey={toolsKey}
          patient={pt}
          rotation={rotation}
          onBack={() => setView('list')}
          onUpdate={updatePatient}
        />
      );
    }
  }

  return (
    <PatientList
      rotation={rotation}
      setRotation={(r) => { setRotation(r); saveRot(r); }}
      patients={patients}
      onSelect={(id) => { setSelectedId(id); setView('patient'); }}
      onAdd={() => { const p = newPatient(rotation); addPatient(p); setSelectedId(p.id); setView('patient'); }}
      onRemove={removePatient}
      onSignOut={() => { toolsKeyStore.clear(); setToolsKey(null); setPatients([]); setView('gate'); }}
    />
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

function ToolsGate({ onValidated }: { onValidated: (k: string, rot: Rotation) => void }) {
  const [key, setKey] = useState('');
  const [rotation, setRotation] = useState<Rotation>('General Medicine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setError(''); setLoading(true);
    try {
      const { valid } = await toolsApi.validate(key.trim());
      if (!valid) throw new Error('Invalid key');
      onValidated(key.trim(), rotation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid key');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-teal-50/40">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Intern Tools</h1>
          <p className="text-sm text-teal-600 mt-1">Clinical patient tracker & aide</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-teal-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Current rotation</label>
            <select value={rotation} onChange={(e) => setRotation(e.target.value as Rotation)}
              className="w-full px-3 py-2.5 rounded-xl border border-teal-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              {ROTATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Your personal key"
              autoComplete="off" disabled={loading}
              className="w-full px-4 py-3 rounded-2xl border border-teal-100 text-sm font-mono text-center tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50" />
            {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading || !key.trim()}
              className="w-full py-3 text-white text-sm font-semibold rounded-2xl transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
              {loading ? 'Validating…' : 'Open intern tools'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Drafts must be reviewed &amp; signed · Private aide</p>
      </div>
    </div>
  );
}

// ─── Patient list ─────────────────────────────────────────────────────────────

function PatientList({ rotation, setRotation, patients, onSelect, onAdd, onRemove, onSignOut }: {
  rotation: Rotation; setRotation: (r: Rotation) => void;
  patients: Patient[]; onSelect: (id: string) => void;
  onAdd: () => void; onRemove: (id: string) => void; onSignOut: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const admitted = patients.filter((p) => p.status === 'ADMITTED');
  const discharged = patients.filter((p) => p.status === 'DISCHARGED');

  return (
    <div className="min-h-screen bg-teal-50/30">
      <header className="bg-white border-b border-teal-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">Intern Patient Tracker</div>
            <div className="text-xs text-teal-600 mt-0.5 flex items-center gap-2">
              <span>Rotation:</span>
              <select value={rotation} onChange={(e) => setRotation(e.target.value as Rotation)}
                className="text-xs text-teal-600 font-medium bg-transparent border-none focus:outline-none cursor-pointer">
                {ROTATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAdd}
              className="text-xs px-3 py-1.5 text-white font-semibold rounded-lg transition"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
              + Add patient
            </button>
            <button onClick={onSignOut} className="text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600 transition">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <PatientSection title="Admitted" patients={admitted} onSelect={onSelect}
          onRemove={(id) => setConfirmRemove(id)} />
        {discharged.length > 0 && (
          <PatientSection title="Discharged" patients={discharged} onSelect={onSelect}
            onRemove={(id) => setConfirmRemove(id)} dim />
        )}
        {patients.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-teal-50 border border-teal-100">
              <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 font-medium">No patients yet</p>
            <p className="text-xs text-gray-400 mt-1">Tap "Add patient" to start tracking your first admission.</p>
          </div>
        )}
      </div>

      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Remove patient?</h3>
            <p className="text-sm text-gray-500 mt-1">All data for this patient will be deleted. This cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => { onRemove(confirmRemove); setConfirmRemove(null); }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm text-white font-semibold transition">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientSection({ title, patients, onSelect, onRemove, dim }: {
  title: string; patients: Patient[]; onSelect: (id: string) => void;
  onRemove: (id: string) => void; dim?: boolean;
}) {
  if (!patients.length) return null;
  return (
    <div>
      <h2 className={`text-xs font-bold uppercase tracking-wider mb-3 ${dim ? 'text-gray-400' : 'text-teal-700'}`}>{title}</h2>
      <div className="space-y-2">
        {patients.map((p) => (
          <div key={p.id} className={`bg-white rounded-xl border ${dim ? 'border-gray-100 opacity-70' : 'border-teal-100 hover:border-teal-300 hover:shadow-sm'} transition flex items-center`}>
            <button onClick={() => onSelect(p.id)} className="flex-1 text-left p-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${dim ? 'bg-gray-300' : 'bg-teal-500'}`}>
                  {(p.name || p.ageSex || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{p.name || p.ageSex || 'Unnamed patient'}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {[p.ward, p.admission.workingDiagnosis || p.rotation].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            </button>
            <button onClick={() => onRemove(p.id)} className="p-3 mr-1 text-gray-300 hover:text-red-400 transition" title="Remove patient">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Patient workspace ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'admission', label: 'Admission' },
  { id: 'notes', label: 'Progress' },
  { id: 'labs', label: 'Labs' },
  { id: 'diagnosis', label: 'Dx / Mgmt' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'present', label: 'Present' },
];

function PatientWorkspace({ toolsKey, patient, rotation, onBack, onUpdate }: {
  toolsKey: string; patient: Patient; rotation: string;
  onBack: () => void; onUpdate: (p: Patient) => void;
}) {
  const [tab, setTab] = useState<Tab>('admission');
  const [editingName, setEditingName] = useState(!patient.name);
  const [nameInput, setNameInput] = useState(patient.name);

  function upd(patch: Partial<Patient>) { onUpdate({ ...patient, ...patch }); }

  return (
    <div className="min-h-screen bg-teal-50/30 flex flex-col">
      <header className="bg-white border-b border-teal-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-teal-600 p-1 -ml-1 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                  onBlur={() => { upd({ name: nameInput }); setEditingName(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { upd({ name: nameInput }); setEditingName(false); } }}
                  placeholder="Patient name / label…"
                  className="text-sm font-semibold text-gray-900 bg-transparent border-b border-teal-300 focus:outline-none w-full max-w-xs" />
              ) : (
                <button onClick={() => setEditingName(true)} className="text-sm font-semibold text-gray-900 hover:text-teal-700 text-left truncate max-w-xs">
                  {patient.name || 'Tap to name patient'}
                </button>
              )}
              <div className="text-xs text-teal-600 mt-0.5">{[patient.ageSex, patient.ward, patient.rotation].filter(Boolean).join(' · ')}</div>
            </div>
            <button onClick={() => upd({ status: patient.status === 'ADMITTED' ? 'DISCHARGED' : 'ADMITTED' })}
              className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${patient.status === 'ADMITTED' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
              {patient.status === 'ADMITTED' ? 'Admitted' : 'Discharged'}
            </button>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${tab === t.id ? 'bg-teal-600 text-white' : 'text-gray-500 hover:text-teal-700 hover:bg-teal-50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {tab === 'admission' && <AdmissionTab toolsKey={toolsKey} patient={patient} onUpdate={onUpdate} />}
        {tab === 'notes' && <ProgressNotesTab toolsKey={toolsKey} patient={patient} onUpdate={onUpdate} />}
        {tab === 'labs' && <LabsTab toolsKey={toolsKey} patient={patient} onUpdate={onUpdate} />}
        {tab === 'diagnosis' && <DiagnosisMgmtTab patient={patient} onUpdate={onUpdate} />}
        {tab === 'formulas' && <FormulasTab />}
        {tab === 'present' && <PresentTab toolsKey={toolsKey} patient={patient} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: 'text' | 'textarea'; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-teal-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
      )}
    </div>
  );
}

function AiDisclaimer() {
  return (
    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mt-1">
      AI DRAFT — review, correct, and sign before use. Verify every detail against source notes.
    </div>
  );
}

function GenBtn({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="text-xs px-4 py-2 text-white font-semibold rounded-xl transition disabled:opacity-40"
      style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
      {loading ? 'Generating…' : label}
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-teal-100 shadow-sm p-5 ${className}`}>{children}</div>;
}

// ─── Admission tab ────────────────────────────────────────────────────────────

function AdmissionTab({ toolsKey, patient, onUpdate }: {
  toolsKey: string; patient: Patient; onUpdate: (p: Patient) => void;
}) {
  const a = patient.admission;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNote, setShowNote] = useState(!!a.aiNote);

  function setAdm(patch: Partial<AdmissionData>) {
    onUpdate({ ...patient, admission: { ...a, ...patch } });
  }

  function upd(key: keyof AdmissionData) {
    return (v: string) => setAdm({ [key]: v } as Partial<AdmissionData>);
  }

  async function structure() {
    setError(''); setLoading(true);
    try {
      const { document } = await toolsApi.admissionNote(toolsKey, {
        rotation: patient.rotation, ageSex: patient.ageSex, hospitalNumber: patient.hospitalNumber,
        ward: patient.ward, admissionDate: patient.admissionDate,
        chiefComplaint: a.chiefComplaint, hpi: a.hpi, pmh: a.pmh,
        medications: a.medications, allergies: a.allergies,
        familyHistory: a.familyHistory, socialHistory: a.socialHistory,
        ros: a.ros, examination: a.examination, investigations: a.investigations,
        workingDiagnosis: a.workingDiagnosis, managementPlan: a.managementPlan,
      });
      setAdm({ aiNote: document });
      setShowNote(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Patient details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Age & sex" value={patient.ageSex} onChange={(v) => onUpdate({ ...patient, ageSex: v })} placeholder="e.g. 34F" />
          <Field label="Hospital number" value={patient.hospitalNumber} onChange={(v) => onUpdate({ ...patient, hospitalNumber: v })} />
          <Field label="Ward / unit" value={patient.ward} onChange={(v) => onUpdate({ ...patient, ward: v })} />
          <Field label="Admission date" value={patient.admissionDate} onChange={(v) => onUpdate({ ...patient, admissionDate: v })} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Admission clerking</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Field label="Chief complaint" value={a.chiefComplaint} onChange={upd('chiefComplaint')} placeholder="Why is the patient here?" />
          </div>
          <div className="sm:col-span-2">
            <Field label="History of presenting illness" value={a.hpi} onChange={upd('hpi')} type="textarea" rows={4} placeholder="Onset, duration, character, severity, radiation, aggravating/relieving factors, associated symptoms…" />
          </div>
          <Field label="Past medical / surgical history" value={a.pmh} onChange={upd('pmh')} type="textarea" rows={3} placeholder="Previous diagnoses, hospitalisations, operations…" />
          <Field label="Current medications" value={a.medications} onChange={upd('medications')} type="textarea" rows={3} placeholder="Name, dose, frequency, route…" />
          <Field label="Allergies" value={a.allergies} onChange={upd('allergies')} placeholder="Drug, food, latex — include reaction" />
          <Field label="Family history" value={a.familyHistory} onChange={upd('familyHistory')} placeholder="Relevant family conditions…" />
          <div className="sm:col-span-2">
            <Field label="Social history" value={a.socialHistory} onChange={upd('socialHistory')} type="textarea" rows={2} placeholder="Occupation, smoking, alcohol, substances, living situation, sexual history (if relevant)…" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Review of systems (positive & relevant negatives)" value={a.ros} onChange={upd('ros')} type="textarea" rows={3} placeholder="System-by-system screening…" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Examination findings" value={a.examination} onChange={upd('examination')} type="textarea" rows={5} placeholder="Vitals, general, head to toe…" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Investigations / results" value={a.investigations} onChange={upd('investigations')} type="textarea" rows={3} placeholder="Labs ordered, results available, imaging…" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Working diagnosis" value={a.workingDiagnosis} onChange={upd('workingDiagnosis')} placeholder="Your working diagnosis" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Management plan" value={a.managementPlan} onChange={upd('managementPlan')} type="textarea" rows={3} placeholder="Immediate orders, monitoring, consults, fluids, analgesia…" />
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
        <div className="mt-4 flex gap-2">
          <GenBtn loading={loading} onClick={structure} label="Structure with AI" />
          {a.aiNote && (
            <button onClick={() => setShowNote((s) => !s)}
              className="text-xs px-4 py-2 border border-teal-200 text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition">
              {showNote ? 'Hide note' : 'Show AI note'}
            </button>
          )}
        </div>
      </Card>

      {showNote && a.aiNote && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-teal-800">AI Structured Admission Note</h3>
            <button onClick={async () => {
              const txt = formatAdmissionNote(a.aiNote!);
              await navigator.clipboard.writeText(txt);
            }} className="text-xs px-3 py-1.5 border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 transition">Copy</button>
          </div>
          <AiDisclaimer />
          <AdmissionNoteDisplay note={a.aiNote} />
        </Card>
      )}
    </div>
  );
}

function AdmissionNoteDisplay({ note }: { note: AdmissionNote }) {
  const rows: [string, string][] = [
    ['Presenting Complaint', note.presentingComplaint],
    ['History of Present Illness', note.historyOfPresentIllness],
    ['Past Medical History', note.pastMedicalHistory],
    ['Medications', note.medications],
    ['Allergies', note.allergies],
    ['Family History', note.familyHistory],
    ['Social History', note.socialHistory],
    ['Review of Systems', note.reviewOfSystems],
    ['Examination Findings', note.examinationFindings],
    ['Working Diagnosis', note.workingDiagnosis],
  ];
  return (
    <div className="mt-4 space-y-4 text-sm">
      {rows.map(([label, val]) => val && val !== 'Not documented' && (
        <div key={label}>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">{label}</div>
          <div className="text-gray-700 whitespace-pre-wrap">{val}</div>
        </div>
      ))}
      {note.investigations.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Investigations</div>
          <ul className="space-y-0.5">{note.investigations.map((i, k) => <li key={k} className="text-gray-700">• {i}</li>)}</ul>
        </div>
      )}
      {note.differentials.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Differentials</div>
          <div className="space-y-2">
            {note.differentials.map((d, k) => (
              <div key={k} className="bg-teal-50 rounded-lg px-3 py-2">
                <div className="font-semibold text-teal-800">{k + 1}. {d.diagnosis} <span className="font-normal text-teal-600">({d.icd10})</span></div>
                <div className="text-gray-600 text-xs mt-0.5">{d.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {note.immediateManagement.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Immediate Management (&lt;24h)</div>
          <ul className="space-y-0.5">{note.immediateManagement.map((i, k) => <li key={k} className="text-gray-700">• {i}</li>)}</ul>
        </div>
      )}
      {note.ongoingManagement.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">Ongoing Management</div>
          <ul className="space-y-0.5">{note.ongoingManagement.map((i, k) => <li key={k} className="text-gray-700">• {i}</li>)}</ul>
        </div>
      )}
      {note.concerns.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Concerns / Red flags</div>
          <ul className="space-y-0.5">{note.concerns.map((c, k) => <li key={k} className="text-red-700 text-sm">⚠ {c}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function formatAdmissionNote(note: AdmissionNote): string {
  let out = 'ADMISSION CLERKING NOTE\n=======================\n';
  out += `Patient: ${note.patient.ageSex}   Hosp No: ${note.patient.hospitalNumber}   Ward: ${note.patient.ward}\n`;
  out += `Admission: ${note.admissionDate}\n\n`;
  const rows: [string, string][] = [
    ['PRESENTING COMPLAINT', note.presentingComplaint],
    ['HISTORY OF PRESENT ILLNESS', note.historyOfPresentIllness],
    ['PAST MEDICAL HISTORY', note.pastMedicalHistory],
    ['MEDICATIONS', note.medications],
    ['ALLERGIES', note.allergies],
    ['FAMILY HISTORY', note.familyHistory],
    ['SOCIAL HISTORY', note.socialHistory],
    ['REVIEW OF SYSTEMS', note.reviewOfSystems],
    ['EXAMINATION FINDINGS', note.examinationFindings],
    ['WORKING DIAGNOSIS', note.workingDiagnosis],
  ];
  rows.forEach(([l, v]) => { if (v && v !== 'Not documented') out += `${l}:\n${v}\n\n`; });
  if (note.investigations.length) out += `INVESTIGATIONS:\n${note.investigations.map((i) => `  - ${i}`).join('\n')}\n\n`;
  if (note.differentials.length) {
    out += 'DIFFERENTIALS:\n';
    note.differentials.forEach((d, k) => { out += `  ${k + 1}. ${d.diagnosis} (${d.icd10}) — ${d.rationale}\n`; });
    out += '\n';
  }
  if (note.immediateManagement.length) out += `IMMEDIATE MANAGEMENT (<24h):\n${note.immediateManagement.map((i) => `  - ${i}`).join('\n')}\n\n`;
  if (note.ongoingManagement.length) out += `ONGOING MANAGEMENT:\n${note.ongoingManagement.map((i) => `  - ${i}`).join('\n')}\n\n`;
  if (note.concerns.length) out += `CONCERNS / RED FLAGS:\n${note.concerns.map((c) => `  ⚠ ${c}`).join('\n')}\n\n`;
  out += `---\n${note.disclaimer}`;
  return out;
}

// ─── Progress notes tab ───────────────────────────────────────────────────────

function ProgressNotesTab({ toolsKey, patient, onUpdate }: {
  toolsKey: string; patient: Patient; onUpdate: (p: Patient) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: today(), hospitalDay: '', narrative: '', labResults: '' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  function addNote() {
    const n: ProgressNote = { id: uid(), ...form, aiNote: null };
    onUpdate({ ...patient, progressNotes: [...patient.progressNotes, n] });
    setAdding(false);
    setForm({ date: today(), hospitalDay: '', narrative: '', labResults: '' });
  }

  function updateNote(id: string, patch: Partial<ProgressNote>) {
    onUpdate({ ...patient, progressNotes: patient.progressNotes.map((n) => n.id === id ? { ...n, ...patch } : n) });
  }

  function removeNote(id: string) {
    onUpdate({ ...patient, progressNotes: patient.progressNotes.filter((n) => n.id !== id) });
  }

  async function generateNote(note: ProgressNote) {
    setError(''); setLoading(note.id);
    try {
      const { document } = await toolsApi.wardNote(toolsKey, {
        ageSex: patient.ageSex, hospitalNumber: patient.hospitalNumber,
        ward: patient.ward, hospitalDay: note.hospitalDay,
        workingDiagnosis: patient.admission.workingDiagnosis,
        previousNotes: patient.admission.hpi + '\n\n' + patient.progressNotes.filter((n) => n.id !== note.id).map((n) => `Day ${n.hospitalDay}:\n${n.narrative}`).join('\n\n'),
        labResults: note.labResults || patient.labs.map((l) => `${l.date}:\n${l.rawResults}`).join('\n\n'),
        todayStatus: note.narrative,
      });
      updateNote(note.id, { aiNote: document });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally { setLoading(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Progress Notes</h3>
        <button onClick={() => setAdding(true)}
          className="text-xs px-3 py-1.5 text-white font-semibold rounded-lg transition"
          style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
          + Add note
        </button>
      </div>

      {adding && (
        <Card>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">New progress note</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            <Field label="Hospital day" value={form.hospitalDay} onChange={(v) => setForm((f) => ({ ...f, hospitalDay: v }))} placeholder="e.g. Day 3" />
          </div>
          <Field label="Narrative (S, O, A, P)" value={form.narrative} onChange={(v) => setForm((f) => ({ ...f, narrative: v }))} type="textarea" rows={4} placeholder="Today's events, clinical status, vitals, exam, assessment, plan…" />
          <div className="mt-3">
            <Field label="Today's labs (optional — paste results)" value={form.labResults} onChange={(v) => setForm((f) => ({ ...f, labResults: v }))} type="textarea" rows={3} placeholder="Paste today's blood results…" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addNote}
              className="text-xs px-4 py-2 text-white font-semibold rounded-xl"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>Save note</button>
            <button onClick={() => setAdding(false)} className="text-xs px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
          </div>
        </Card>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}

      {patient.progressNotes.length === 0 && !adding && (
        <div className="text-center py-12 text-sm text-gray-400">No progress notes yet.</div>
      )}

      {[...patient.progressNotes].reverse().map((note) => (
        <Card key={note.id}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-800">{note.date}</span>
              {note.hospitalDay && <span className="ml-2 text-xs text-teal-600 font-medium">{note.hospitalDay}</span>}
            </div>
            <button onClick={() => removeNote(note.id)} className="text-gray-300 hover:text-red-400 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{note.narrative}</div>
          {note.labResults && <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 font-mono whitespace-pre-wrap mb-3">{note.labResults}</div>}
          <GenBtn loading={loading === note.id} onClick={() => generateNote(note)} label="Generate ward note with AI" />
          {note.aiNote && (
            <div className="mt-4">
              <AiDisclaimer />
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                {formatWardNote(note.aiNote)}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Labs tab ─────────────────────────────────────────────────────────────────

function LabsTab({ toolsKey, patient, onUpdate }: {
  toolsKey: string; patient: Patient; onUpdate: (p: Patient) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ date: today(), rawResults: '' });
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  function addEntry() {
    const e: LabEntry = { id: uid(), ...form, interpretation: null };
    onUpdate({ ...patient, labs: [...patient.labs, e] });
    setAdding(false);
    setForm({ date: today(), rawResults: '' });
  }

  function removeEntry(id: string) {
    onUpdate({ ...patient, labs: patient.labs.filter((l) => l.id !== id) });
  }

  async function interpret(entry: LabEntry) {
    setError(''); setLoading(entry.id);
    try {
      const allResults = patient.labs.map((l) => `=== ${l.date} ===\n${l.rawResults}`).join('\n\n');
      const { document } = await toolsApi.interpretLabs(toolsKey, {
        rotation: patient.rotation, ageSex: patient.ageSex,
        workingDiagnosis: patient.admission.workingDiagnosis,
        medications: patient.admission.medications,
        labResults: allResults || entry.rawResults,
      });
      onUpdate({ ...patient, labs: patient.labs.map((l) => l.id === entry.id ? { ...l, interpretation: document } : l) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interpretation failed');
    } finally { setLoading(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Lab Results</h3>
        <button onClick={() => setAdding(true)}
          className="text-xs px-3 py-1.5 text-white font-semibold rounded-lg transition"
          style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
          + Add results
        </button>
      </div>

      {adding && (
        <Card>
          <Field label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          <div className="mt-3">
            <Field label="Paste lab results" value={form.rawResults} onChange={(v) => setForm((f) => ({ ...f, rawResults: v }))} type="textarea" rows={6} placeholder="Paste blood results here — FBC, U&E, LFTs, etc. Multiple days can be pasted for trend analysis." />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={addEntry}
              className="text-xs px-4 py-2 text-white font-semibold rounded-xl"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>Save</button>
            <button onClick={() => setAdding(false)} className="text-xs px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
          </div>
        </Card>
      )}

      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}

      {patient.labs.length === 0 && !adding && (
        <div className="text-center py-12 text-sm text-gray-400">No lab results added yet.</div>
      )}

      {[...patient.labs].reverse().map((entry) => (
        <Card key={entry.id}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">{entry.date}</span>
            <button onClick={() => removeEntry(entry.id)} className="text-gray-300 hover:text-red-400 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 font-mono whitespace-pre-wrap mb-3">{entry.rawResults}</div>
          <GenBtn loading={loading === entry.id} onClick={() => interpret(entry)} label="Interpret with AI (all dates)" />
          {entry.interpretation && (
            <div className="mt-4 space-y-3">
              <AiDisclaimer />
              {entry.interpretation.critical.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Critical Values</div>
                  {entry.interpretation.critical.map((c, k) => <div key={k} className="text-red-700 text-sm">⚠ {c}</div>)}
                </div>
              )}
              <div className="text-sm text-teal-800 font-medium bg-teal-50 rounded-xl px-3 py-2">{entry.interpretation.summary}</div>
              {entry.interpretation.trends.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Trends</div>
                  {entry.interpretation.trends.map((t, k) => <div key={k} className="text-sm text-gray-700">↗ {t}</div>)}
                </div>
              )}
              {entry.interpretation.groupedInterpretation.map((g, k) => (
                <div key={k} className="border border-teal-100 rounded-xl px-3 py-3">
                  <div className="text-xs font-bold text-teal-700 mb-1">{g.group}</div>
                  <div className="text-sm text-gray-700">{g.findings}</div>
                  {g.significance && <div className="text-xs text-gray-500 mt-1 italic">{g.significance}</div>}
                </div>
              ))}
              {entry.interpretation.suggestedFurther.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Suggested Further</div>
                  {entry.interpretation.suggestedFurther.map((s, k) => (
                    <div key={k} className="text-sm text-gray-700">
                      <span className={`text-xs font-semibold mr-1 ${s.priority === 'URGENT' ? 'text-red-600' : 'text-gray-400'}`}>[{s.priority}]</span>
                      {s.test} — {s.rationale}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Diagnosis & management tab ───────────────────────────────────────────────

const DX_TYPES: DiagnosisItem['type'][] = ['PRIMARY', 'SECONDARY', 'COMPLICATION'];
const DX_STATUS: DiagnosisItem['status'][] = ['ACTIVE', 'RESOLVED', 'CHRONIC'];
const MGMT_STATUS: ManagementItem['status'][] = ['ACTIVE', 'RESOLVED'];

function DiagnosisMgmtTab({ patient, onUpdate }: { patient: Patient; onUpdate: (p: Patient) => void }) {
  const [addingDx, setAddingDx] = useState(false);
  const [addingMgmt, setAddingMgmt] = useState(false);
  const [dxForm, setDxForm] = useState({ name: '', icd10: '', type: 'PRIMARY' as DiagnosisItem['type'], status: 'ACTIVE' as DiagnosisItem['status'] });
  const [mgmtForm, setMgmtForm] = useState({ problem: '', plan: '', status: 'ACTIVE' as ManagementItem['status'] });

  function addDx() {
    const d: DiagnosisItem = { id: uid(), ...dxForm };
    onUpdate({ ...patient, diagnoses: [...patient.diagnoses, d] });
    setAddingDx(false);
    setDxForm({ name: '', icd10: '', type: 'PRIMARY', status: 'ACTIVE' });
  }

  function addMgmt() {
    const m: ManagementItem = { id: uid(), ...mgmtForm };
    onUpdate({ ...patient, management: [...patient.management, m] });
    setAddingMgmt(false);
    setMgmtForm({ problem: '', plan: '', status: 'ACTIVE' });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Diagnosis List</h3>
          <button onClick={() => setAddingDx(true)}
            className="text-xs px-3 py-1.5 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>+ Add dx</button>
        </div>

        {addingDx && (
          <Card className="mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Diagnosis" value={dxForm.name} onChange={(v) => setDxForm((f) => ({ ...f, name: v }))} placeholder="e.g. Community-acquired pneumonia" />
              </div>
              <Field label="ICD-10 code" value={dxForm.icd10} onChange={(v) => setDxForm((f) => ({ ...f, icd10: v }))} placeholder="e.g. J18.9" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select value={dxForm.type} onChange={(e) => setDxForm((f) => ({ ...f, type: e.target.value as DiagnosisItem['type'] }))}
                  className="w-full px-3 py-2 rounded-xl border border-teal-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {DX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={dxForm.status} onChange={(e) => setDxForm((f) => ({ ...f, status: e.target.value as DiagnosisItem['status'] }))}
                  className="w-full px-3 py-2 rounded-xl border border-teal-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {DX_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={addDx}
                className="text-xs px-4 py-2 text-white font-semibold rounded-xl"
                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>Add</button>
              <button onClick={() => setAddingDx(false)} className="text-xs px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
            </div>
          </Card>
        )}

        {patient.diagnoses.length === 0 && !addingDx && (
          <div className="text-center py-8 text-sm text-gray-400 bg-white rounded-2xl border border-teal-100">No diagnoses added yet.</div>
        )}

        <div className="space-y-2">
          {patient.diagnoses.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-teal-100 p-3 flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                  {d.icd10 && <span className="text-xs text-teal-600 font-mono">{d.icd10}</span>}
                </div>
                <div className="mt-1 flex gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.type === 'PRIMARY' ? 'bg-teal-100 text-teal-700' : d.type === 'SECONDARY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{d.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : d.status === 'RESOLVED' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                </div>
              </div>
              <button onClick={() => onUpdate({ ...patient, diagnoses: patient.diagnoses.filter((x) => x.id !== d.id) })}
                className="text-gray-300 hover:text-red-400 transition mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Management Plan</h3>
          <button onClick={() => setAddingMgmt(true)}
            className="text-xs px-3 py-1.5 text-white font-semibold rounded-lg"
            style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>+ Add item</button>
        </div>

        {addingMgmt && (
          <Card className="mb-3">
            <Field label="Problem" value={mgmtForm.problem} onChange={(v) => setMgmtForm((f) => ({ ...f, problem: v }))} placeholder="e.g. CAP — antibiotic therapy" />
            <div className="mt-3">
              <Field label="Plan / interventions" value={mgmtForm.plan} onChange={(v) => setMgmtForm((f) => ({ ...f, plan: v }))} type="textarea" rows={2} placeholder="e.g. Amoxicillin 500mg TDS PO × 5/7, escalate if no response at 48h…" />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                <select value={mgmtForm.status} onChange={(e) => setMgmtForm((f) => ({ ...f, status: e.target.value as ManagementItem['status'] }))}
                  className="px-3 py-2 rounded-xl border border-teal-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
                  {MGMT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={addMgmt}
                  className="text-xs px-4 py-2 text-white font-semibold rounded-xl"
                  style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>Add</button>
                <button onClick={() => setAddingMgmt(false)} className="text-xs px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </Card>
        )}

        {patient.management.length === 0 && !addingMgmt && (
          <div className="text-center py-8 text-sm text-gray-400 bg-white rounded-2xl border border-teal-100">No management items added yet.</div>
        )}

        <div className="space-y-2">
          {patient.management.map((m) => (
            <div key={m.id} className={`bg-white rounded-xl border p-3 flex items-start gap-3 ${m.status === 'RESOLVED' ? 'border-gray-100 opacity-60' : 'border-teal-100'}`}>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{m.problem}</div>
                <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{m.plan}</div>
                <button onClick={() => onUpdate({ ...patient, management: patient.management.map((x) => x.id === m.id ? { ...x, status: x.status === 'ACTIVE' ? 'RESOLVED' : 'ACTIVE' } : x) })}
                  className={`mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.status}
                </button>
              </div>
              <button onClick={() => onUpdate({ ...patient, management: patient.management.filter((x) => x.id !== m.id) })}
                className="text-gray-300 hover:text-red-400 transition mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Present tab ──────────────────────────────────────────────────────────────

function PresentTab({ toolsKey, patient, onUpdate }: {
  toolsKey: string; patient: Patient; onUpdate: (p: Patient) => void;
}) {
  const [point, setPoint] = useState<'ADMISSION' | 'PROGRESS' | 'DISCHARGE'>('ADMISSION');
  const [hospitalDay, setHospitalDay] = useState('');
  const [loading, setLoading] = useState(false);
  const [dischLoading, setDischLoading] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(patient.dischargeDate || today());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [dischCopied, setDischCopied] = useState(false);

  async function generateDischarge() {
    setError(''); setDischLoading(true);
    const a = patient.admission;
    const notes = [
      `Admission: ${a.chiefComplaint}\n${a.hpi}`,
      a.pmh && `PMH: ${a.pmh}`,
      a.medications && `Medications: ${a.medications}`,
      a.examination && `Examination: ${a.examination}`,
      a.investigations && `Investigations: ${a.investigations}`,
      a.managementPlan && `Management: ${a.managementPlan}`,
      patient.progressNotes.map((n) => `${n.date} ${n.hospitalDay}:\n${n.narrative}`).join('\n---\n'),
      patient.labs.map((l) => `Labs ${l.date}:\n${l.rawResults}`).join('\n'),
    ].filter(Boolean).join('\n\n');
    const primaryDx = patient.diagnoses.find((d) => d.type === 'PRIMARY');
    try {
      const { document } = await toolsApi.discharge(toolsKey, {
        ageSex: patient.ageSex, hospitalNumber: patient.hospitalNumber, ward: patient.ward,
        admissionDate: patient.admissionDate, dischargeDate,
        primaryDiagnosis: primaryDx ? `${primaryDx.name} (${primaryDx.icd10})` : a.workingDiagnosis,
        notes,
      });
      onUpdate({ ...patient, dischargeSummary: document, dischargeDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discharge summary generation failed');
    } finally { setDischLoading(false); }
  }

  async function generate() {
    setError(''); setLoading(true);
    const a = patient.admission;
    const clinicalData = [
      `DEMOGRAPHICS: ${patient.ageSex}, Ward: ${patient.ward}, Admitted: ${patient.admissionDate}`,
      `CHIEF COMPLAINT: ${a.chiefComplaint}`,
      `HPI: ${a.hpi}`,
      `PMH: ${a.pmh}`,
      `MEDICATIONS: ${a.medications}`,
      `ALLERGIES: ${a.allergies}`,
      `SOCIAL HISTORY: ${a.socialHistory}`,
      `EXAMINATION: ${a.examination}`,
      `INVESTIGATIONS: ${a.investigations}`,
      `WORKING DIAGNOSIS: ${a.workingDiagnosis}`,
      `MANAGEMENT PLAN: ${a.managementPlan}`,
      patient.diagnoses.length ? `DIAGNOSIS LIST: ${patient.diagnoses.map((d) => `${d.name} (${d.icd10}) [${d.type}/${d.status}]`).join('; ')}` : '',
      patient.progressNotes.length ? `PROGRESS NOTES:\n${patient.progressNotes.map((n) => `${n.date} ${n.hospitalDay}:\n${n.narrative}`).join('\n---\n')}` : '',
      patient.labs.length ? `LAB RESULTS:\n${patient.labs.map((l) => `=== ${l.date} ===\n${l.rawResults}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    try {
      const { document } = await toolsApi.presentPatient(toolsKey, {
        rotation: patient.rotation, ageSex: patient.ageSex,
        hospitalNumber: patient.hospitalNumber, ward: patient.ward,
        presentationPoint: point, hospitalDay: hospitalDay || undefined,
        clinicalData,
      });
      onUpdate({ ...patient, presentation: document });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally { setLoading(false); }
  }

  async function copy() {
    if (!patient.presentation) return;
    const txt = `${patient.presentation.title}\n${'─'.repeat(60)}\n\n${patient.presentation.presentation}\n\n` +
      (patient.presentation.keyPoints.length ? `KEY POINTS:\n${patient.presentation.keyPoints.map((p) => `• ${p}`).join('\n')}\n\n` : '') +
      (patient.presentation.questionsToExpect.length ? `QUESTIONS TO EXPECT:\n${patient.presentation.questionsToExpect.map((q) => `? ${q}`).join('\n')}\n\n` : '') +
      `---\n${patient.presentation.disclaimer}`;
    await navigator.clipboard.writeText(txt);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function copyDischarge() {
    if (!patient.dischargeSummary) return;
    await navigator.clipboard.writeText(formatDischarge(patient.dischargeSummary));
    setDischCopied(true); setTimeout(() => setDischCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-4">Generate oral case presentation</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Presentation point</label>
            <select value={point} onChange={(e) => setPoint(e.target.value as typeof point)}
              className="w-full px-3 py-2 rounded-xl border border-teal-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="ADMISSION">Admission (full clerking)</option>
              <option value="PROGRESS">Progress update</option>
              <option value="DISCHARGE">Discharge / handover</option>
            </select>
          </div>
          {point === 'PROGRESS' && (
            <Field label="Hospital day" value={hospitalDay} onChange={setHospitalDay} placeholder="e.g. Day 3" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">All patient data (admission, notes, labs, diagnoses) will be sent to the AI to generate an appropriate oral presentation.</p>
        {error && <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
        <div className="mt-4">
          <GenBtn loading={loading} onClick={generate} label="Generate presentation" />
        </div>
      </Card>

      {patient.presentation && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-teal-800">{patient.presentation.title}</h3>
            <button onClick={copy} className="text-xs px-3 py-1.5 border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 transition">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <AiDisclaimer />
          <div className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{patient.presentation.presentation}</div>
          {patient.presentation.keyPoints.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">Key points</div>
              <ul className="space-y-1">{patient.presentation.keyPoints.map((p, k) => <li key={k} className="text-sm text-gray-700">• {p}</li>)}</ul>
            </div>
          )}
          {patient.presentation.questionsToExpect.length > 0 && (
            <div className="mt-4 bg-teal-50 rounded-xl px-3 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">Questions to expect</div>
              <ul className="space-y-1">{patient.presentation.questionsToExpect.map((q, k) => <li key={k} className="text-sm text-teal-800">? {q}</li>)}</ul>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Discharge Summary</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Discharge date" value={dischargeDate} onChange={setDischargeDate} placeholder="YYYY-MM-DD" />
        </div>
        <p className="text-xs text-gray-400 mb-3">Generates a structured discharge summary from all patient data (clerking, ward notes, labs, diagnoses, management).</p>
        {error && <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>}
        <GenBtn loading={dischLoading} onClick={generateDischarge} label="Generate discharge summary" />
        {patient.dischargeSummary && (
          <div className="mt-4">
            <AiDisclaimer />
            <div className="mt-3 flex justify-end">
              <button onClick={copyDischarge} className="text-xs px-3 py-1.5 border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-50 transition">
                {dischCopied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <pre className="mt-2 text-xs text-gray-700 font-mono whitespace-pre-wrap bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 overflow-auto">{formatDischarge(patient.dischargeSummary)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Formulas tab ─────────────────────────────────────────────────────────────

type FormulaId = 'gcs' | 'qsofa' | 'heart' | 'wells_pe' | 'wells_dvt' | 'crb65' | 'phq9' | 'auditc' | 'ipss' | 'abcd2' | 'centor' | 'mmrc';

const FORMULA_LIST: { id: FormulaId; label: string; category: string }[] = [
  { id: 'gcs', label: 'GCS', category: 'Neuro' },
  { id: 'qsofa', label: 'qSOFA', category: 'Sepsis' },
  { id: 'heart', label: 'HEART Score', category: 'Cardiac' },
  { id: 'wells_pe', label: 'Wells PE', category: 'VTE' },
  { id: 'wells_dvt', label: 'Wells DVT', category: 'VTE' },
  { id: 'crb65', label: 'CRB-65', category: 'Resp' },
  { id: 'mmrc', label: 'mMRC Dyspnoea', category: 'Resp' },
  { id: 'abcd2', label: 'ABCD2 (TIA)', category: 'Neuro' },
  { id: 'phq9', label: 'PHQ-9', category: 'Mental' },
  { id: 'auditc', label: 'AUDIT-C', category: 'Mental' },
  { id: 'ipss', label: 'IPSS', category: 'Urology' },
  { id: 'centor', label: 'Centor / McIsaac', category: 'ENT' },
];

function FormulasTab() {
  const [active, setActive] = useState<FormulaId>('gcs');

  return (
    <div className="flex gap-4">
      <div className="w-40 flex-shrink-0 space-y-1">
        {FORMULA_LIST.map((f) => (
          <button key={f.id} onClick={() => setActive(f.id)}
            className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg transition ${active === f.id ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'}`}>
            <div>{f.label}</div>
            <div className={`text-xs ${active === f.id ? 'text-teal-200' : 'text-gray-400'}`}>{f.category}</div>
          </button>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        {active === 'gcs' && <GCSCalc />}
        {active === 'qsofa' && <QSOFACalc />}
        {active === 'heart' && <HEARTCalc />}
        {active === 'wells_pe' && <WellsPECalc />}
        {active === 'wells_dvt' && <WellsDVTCalc />}
        {active === 'crb65' && <CRB65Calc />}
        {active === 'mmrc' && <MMRCCalc />}
        {active === 'abcd2' && <ABCD2Calc />}
        {active === 'phq9' && <PHQ9Calc />}
        {active === 'auditc' && <AUDITCCalc />}
        {active === 'ipss' && <IPSSCalc />}
        {active === 'centor' && <CentorCalc />}
      </div>
    </div>
  );
}

function ScoreBox({ score, label, color = 'teal' }: { score: number | string; label: string; color?: 'teal' | 'red' | 'amber' | 'green' }) {
  const colors = { teal: 'bg-teal-50 border-teal-200 text-teal-800', red: 'bg-red-50 border-red-200 text-red-800', amber: 'bg-amber-50 border-amber-200 text-amber-800', green: 'bg-green-50 border-green-200 text-green-800' };
  return (
    <div className={`rounded-2xl border p-4 text-center mt-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{score}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

function CheckRow({ label, checked, onChange, weight = 1 }: { label: string; checked: boolean; onChange: (v: boolean) => void; weight?: number }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 accent-teal-600 w-4 h-4" />
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <span className="text-xs text-teal-600 font-mono flex-shrink-0">+{weight}</span>
    </label>
  );
}

function SelectRow({ label, value, onChange, options }: { label: string; value: number; onChange: (v: number) => void; options: { v: number; l: string }[] }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
        <div className="space-y-1">
          {options.map((o) => (
            <label key={o.v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={value === o.v} onChange={() => onChange(o.v)} className="accent-teal-600" />
              <span className="text-sm text-gray-700 flex-1">{o.l}</span>
              <span className="text-xs text-teal-600 font-mono">{o.v > 0 ? `+${o.v}` : o.v}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function GCSCalc() {
  const [e, setE] = useState(4); const [v, setV] = useState(5); const [m, setM] = useState(6);
  const total = e + v + m;
  const interp = total >= 13 ? { l: 'Mild (13-15)', c: 'green' as const } : total >= 9 ? { l: 'Moderate (9-12)', c: 'amber' as const } : { l: 'Severe ≤8 — consider intubation', c: 'red' as const };
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">Glasgow Coma Scale</h3>
      <p className="text-xs text-gray-500 mb-4">Assesses level of consciousness. Minimum 3, maximum 15.</p>
      <div className="space-y-4">
        <SelectRow label="Eyes (E)" value={e} onChange={setE} options={[{ v: 4, l: 'Spontaneous' }, { v: 3, l: 'To voice' }, { v: 2, l: 'To pain' }, { v: 1, l: 'None' }]} />
        <SelectRow label="Verbal (V)" value={v} onChange={setV} options={[{ v: 5, l: 'Oriented' }, { v: 4, l: 'Confused' }, { v: 3, l: 'Inappropriate words' }, { v: 2, l: 'Incomprehensible sounds' }, { v: 1, l: 'None' }]} />
        <SelectRow label="Motor (M)" value={m} onChange={setM} options={[{ v: 6, l: 'Obeys commands' }, { v: 5, l: 'Localises pain' }, { v: 4, l: 'Withdrawal' }, { v: 3, l: 'Abnormal flexion' }, { v: 2, l: 'Extension' }, { v: 1, l: 'None' }]} />
      </div>
      <ScoreBox score={`${total}/15 (E${e}V${v}M${m})`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function QSOFACalc() {
  const [rr, setRr] = useState(false); const [ams, setAms] = useState(false); const [sbp, setSbp] = useState(false);
  const score = [rr, ams, sbp].filter(Boolean).length;
  const interp = score >= 2 ? { l: 'HIGH RISK — sepsis likely, investigate urgently', c: 'red' as const } : score === 1 ? { l: 'Intermediate — reassess, monitor closely', c: 'amber' as const } : { l: 'Low risk (does not exclude sepsis)', c: 'green' as const };
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">qSOFA</h3>
      <p className="text-xs text-gray-500 mb-4">Quick SOFA for suspected sepsis in non-ICU settings. Score ≥2 = high risk.</p>
      <div className="space-y-3">
        <CheckRow label="Respiratory rate ≥22/min" checked={rr} onChange={setRr} />
        <CheckRow label="Altered mentation (GCS &lt;15 or new confusion)" checked={ams} onChange={setAms} />
        <CheckRow label="Systolic BP ≤100 mmHg" checked={sbp} onChange={setSbp} />
      </div>
      <ScoreBox score={`${score}/3`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function HEARTCalc() {
  const [history, setHistory] = useState(0); const [ecg, setEcg] = useState(0); const [age, setAge] = useState(0);
  const [rf, setRf] = useState(0); const [trop, setTrop] = useState(0);
  const score = history + ecg + age + rf + trop;
  const interp = score >= 7 ? { l: 'HIGH (50-65%) — admit, early invasive strategy', c: 'red' as const } : score >= 4 ? { l: 'MODERATE (12-17%) — observe, further testing', c: 'amber' as const } : { l: 'LOW (0.9-1.7%) — consider early discharge with follow-up', c: 'green' as const };
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">HEART Score</h3>
      <p className="text-xs text-gray-500 mb-4">Chest pain risk stratification. 0-3 Low, 4-6 Moderate, 7-10 High.</p>
      <div className="space-y-4">
        <SelectRow label="H — History" value={history} onChange={setHistory} options={[{ v: 2, l: 'Highly suspicious' }, { v: 1, l: 'Moderately suspicious' }, { v: 0, l: 'Slightly suspicious' }]} />
        <SelectRow label="E — ECG" value={ecg} onChange={setEcg} options={[{ v: 2, l: 'Significant ST depression' }, { v: 1, l: 'Non-specific repolarisation change / LBBB / PM' }, { v: 0, l: 'Normal' }]} />
        <SelectRow label="A — Age" value={age} onChange={setAge} options={[{ v: 2, l: '≥65 years' }, { v: 1, l: '45–64 years' }, { v: 0, l: '<45 years' }]} />
        <SelectRow label="R — Risk factors" value={rf} onChange={setRf} options={[{ v: 2, l: '≥3 risk factors or known atherosclerotic disease' }, { v: 1, l: '1–2 risk factors (HTN, hyperlipidaemia, DM, obesity, smoking, FHx)' }, { v: 0, l: 'None known' }]} />
        <SelectRow label="T — Troponin" value={trop} onChange={setTrop} options={[{ v: 2, l: '≥3× upper limit of normal' }, { v: 1, l: '1–3× upper limit of normal' }, { v: 0, l: '≤upper limit of normal' }]} />
      </div>
      <ScoreBox score={`${score}/10`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function WellsPECalc() {
  type K = 'dvt' | 'pelikely' | 'hr' | 'immob' | 'prevDvt' | 'haemo' | 'malignancy';
  const init: Record<K, boolean> = { dvt: false, pelikely: false, hr: false, immob: false, prevDvt: false, haemo: false, malignancy: false };
  const [vals, setVals] = useState(init);
  const weights: Record<K, number> = { dvt: 3, pelikely: 3, hr: 1.5, immob: 1.5, prevDvt: 1.5, haemo: 1, malignancy: 1 };
  const score = (Object.keys(vals) as K[]).reduce((s, k) => s + (vals[k] ? weights[k] : 0), 0);
  const interp = score > 4 ? { l: 'PE LIKELY (>4) — imaging indicated (CT-PA)', c: 'red' as const } : { l: 'PE unlikely (≤4) — consider D-dimer first', c: 'green' as const };

  const items: [K, string, number][] = [
    ['dvt', 'Clinical signs/symptoms of DVT', 3], ['pelikely', 'PE is most/equally likely diagnosis', 3],
    ['hr', 'Heart rate >100 bpm', 1.5], ['immob', 'Immobilisation or surgery in past 4 weeks', 1.5],
    ['prevDvt', 'Previous DVT or PE', 1.5], ['haemo', 'Haemoptysis', 1], ['malignancy', 'Malignancy (active or treated within 6 months)', 1],
  ];

  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">Wells Score — PE</h3>
      <p className="text-xs text-gray-500 mb-4">Pre-test probability for pulmonary embolism. ≤4 unlikely, &gt;4 likely.</p>
      <div className="space-y-3">
        {items.map(([k, l, w]) => (
          <CheckRow key={k} label={l} checked={vals[k]} onChange={(v) => setVals((s) => ({ ...s, [k]: v }))} weight={w} />
        ))}
      </div>
      <ScoreBox score={score.toFixed(1)} label={interp.l} color={interp.c} />
    </Card>
  );
}

function WellsDVTCalc() {
  type K = 'cancer' | 'paralysis' | 'bedridden' | 'tenderness' | 'entireLeg' | 'calf' | 'pitting' | 'collateral' | 'prevDvt' | 'alternative';
  const init: Record<K, boolean> = { cancer: false, paralysis: false, bedridden: false, tenderness: false, entireLeg: false, calf: false, pitting: false, collateral: false, prevDvt: false, alternative: false };
  const [vals, setVals] = useState(init);
  const score = [vals.cancer, vals.paralysis, vals.bedridden, vals.tenderness, vals.entireLeg, vals.calf, vals.pitting, vals.collateral, vals.prevDvt].filter(Boolean).length - (vals.alternative ? 2 : 0);
  const interp = score >= 3 ? { l: 'HIGH probability — imaging indicated', c: 'red' as const } : score >= 1 ? { l: 'MODERATE probability — D-dimer, then consider USS', c: 'amber' as const } : { l: 'LOW probability (≤0) — D-dimer if negative, no further testing', c: 'green' as const };

  const items: [K, string, number][] = [
    ['cancer', 'Active cancer', 1], ['paralysis', 'Paralysis, paresis, or plaster on lower extremity', 1],
    ['bedridden', 'Bedridden ≥3 days or major surgery within 12 weeks', 1],
    ['tenderness', 'Localised tenderness along deep venous system', 1], ['entireLeg', 'Entire leg swollen', 1],
    ['calf', 'Calf swelling >3 cm compared with asymptomatic side', 1],
    ['pitting', 'Pitting oedema (greater in symptomatic leg)', 1], ['collateral', 'Collateral superficial veins', 1],
    ['prevDvt', 'Previously documented DVT', 1], ['alternative', 'Alternative diagnosis at least as likely', -2],
  ];

  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">Wells Score — DVT</h3>
      <p className="text-xs text-gray-500 mb-4">Pre-test probability for deep vein thrombosis. ≤0 Low, 1-2 Moderate, ≥3 High.</p>
      <div className="space-y-3">
        {items.map(([k, l, w]) => (
          <label key={k} className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={vals[k]} onChange={(e) => setVals((s) => ({ ...s, [k]: e.target.checked }))} className="mt-0.5 accent-teal-600 w-4 h-4" />
            <span className="text-sm text-gray-700 flex-1">{l}</span>
            <span className={`text-xs font-mono flex-shrink-0 ${w < 0 ? 'text-red-500' : 'text-teal-600'}`}>{w > 0 ? `+${w}` : w}</span>
          </label>
        ))}
      </div>
      <ScoreBox score={score} label={interp.l} color={interp.c} />
    </Card>
  );
}

function CRB65Calc() {
  const [confusion, setConfusion] = useState(false); const [rr, setRr] = useState(false);
  const [bp, setBp] = useState(false); const [age, setAge] = useState(false);
  const score = [confusion, rr, bp, age].filter(Boolean).length;
  const interp = score >= 3 ? { l: 'HIGH/SEVERE — consider hospital admission urgently', c: 'red' as const } : score >= 1 ? { l: 'INTERMEDIATE — consider hospital assessment', c: 'amber' as const } : { l: 'LOW risk — consider community treatment', c: 'green' as const };
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">CRB-65 (Pneumonia)</h3>
      <p className="text-xs text-gray-500 mb-4">Severity score for community-acquired pneumonia. 0 Low, 1-2 Intermediate, 3-4 High.</p>
      <div className="space-y-3">
        <CheckRow label="Confusion (new)" checked={confusion} onChange={setConfusion} />
        <CheckRow label="Respiratory rate ≥30/min" checked={rr} onChange={setRr} />
        <CheckRow label="Low BP: systolic <90 or diastolic ≤60 mmHg" checked={bp} onChange={setBp} />
        <CheckRow label="Age ≥65 years" checked={age} onChange={setAge} />
      </div>
      <ScoreBox score={`${score}/4`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function MMRCCalc() {
  const [grade, setGrade] = useState(0);
  const descs = [
    'Grade 0: Breathless only with strenuous exercise',
    'Grade 1: Short of breath when hurrying on flat or walking up a slight hill',
    'Grade 2: Walks slower than peers on flat, or stops after 15 min at own pace',
    'Grade 3: Stops for breath after ~100m or a few minutes on flat ground',
    'Grade 4: Too breathless to leave house; breathless when dressing/undressing',
  ];
  const color = grade >= 2 ? 'amber' as const : 'green' as const;
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">mMRC Dyspnoea Scale</h3>
      <p className="text-xs text-gray-500 mb-4">Modified MRC scale. Grade ≥2 = significant breathlessness (COPD impact/escalation threshold).</p>
      <div className="space-y-2">
        {descs.map((d, i) => (
          <label key={i} className="flex items-start gap-3 cursor-pointer">
            <input type="radio" checked={grade === i} onChange={() => setGrade(i)} className="mt-0.5 accent-teal-600" />
            <span className="text-sm text-gray-700">{d}</span>
          </label>
        ))}
      </div>
      <ScoreBox score={`Grade ${grade}`} label={grade >= 2 ? 'Significant — impacts daily life' : 'Mild — less impact'} color={color} />
    </Card>
  );
}

function ABCD2Calc() {
  const [age, setAge] = useState(0); const [bp, setBp] = useState(0); const [clinical, setClinical] = useState(0);
  const [duration, setDuration] = useState(0); const [dm, setDm] = useState(false);
  const score = age + bp + clinical + duration + (dm ? 1 : 0);
  const interp = score >= 6 ? { l: 'HIGH (8%) — admit, urgent workup', c: 'red' as const } : score >= 4 ? { l: 'MODERATE (4%) — urgent outpatient or admit', c: 'amber' as const } : { l: 'LOW (1%) — urgent outpatient TIA clinic', c: 'green' as const };
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">ABCD2 Score (TIA)</h3>
      <p className="text-xs text-gray-500 mb-4">2-day stroke risk after TIA. 0-3 Low, 4-5 Moderate, 6-7 High.</p>
      <div className="space-y-4">
        <SelectRow label="A — Age" value={age} onChange={setAge} options={[{ v: 1, l: '≥60 years' }, { v: 0, l: '<60 years' }]} />
        <SelectRow label="B — Blood pressure at presentation" value={bp} onChange={setBp} options={[{ v: 1, l: 'SBP ≥140 or DBP ≥90 mmHg' }, { v: 0, l: 'Normal' }]} />
        <SelectRow label="C — Clinical features" value={clinical} onChange={setClinical} options={[{ v: 2, l: 'Unilateral weakness' }, { v: 1, l: 'Speech disturbance without weakness' }, { v: 0, l: 'Other' }]} />
        <SelectRow label="D — Duration of symptoms" value={duration} onChange={setDuration} options={[{ v: 2, l: '≥60 minutes' }, { v: 1, l: '10–59 minutes' }, { v: 0, l: '<10 minutes' }]} />
        <CheckRow label="D — Diabetes mellitus" checked={dm} onChange={setDm} />
      </div>
      <ScoreBox score={`${score}/7`} label={interp.l} color={interp.c} />
    </Card>
  );
}

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed; or the opposite — being so fidgety or restless',
  'Thoughts that you would be better off dead, or of hurting yourself in some way',
];

function PHQ9Calc() {
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const interp = total >= 20 ? { l: 'Severe (20-27) — urgent assessment, likely treatment', c: 'red' as const }
    : total >= 15 ? { l: 'Moderately severe (15-19) — active treatment recommended', c: 'red' as const }
    : total >= 10 ? { l: 'Moderate (10-14) — treatment plan warranted', c: 'amber' as const }
    : total >= 5 ? { l: 'Mild (5-9) — watchful waiting, consider counselling', c: 'amber' as const }
    : { l: 'Minimal (0-4) — monitor', c: 'green' as const };
  const labels = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">PHQ-9 (Depression)</h3>
      <p className="text-xs text-gray-500 mb-4">Over the last 2 weeks, how often have you been bothered by…</p>
      <div className="space-y-4">
        {PHQ9_QUESTIONS.map((q, i) => (
          <div key={i}>
            <div className="text-sm text-gray-700 mb-1.5">{i + 1}. {q}</div>
            <div className="flex gap-1 flex-wrap">
              {labels.map((l, v) => (
                <label key={v} className={`flex-1 min-w-0 text-center text-xs cursor-pointer px-1 py-1.5 rounded-lg border transition ${scores[i] === v ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}>
                  <input type="radio" className="sr-only" checked={scores[i] === v} onChange={() => setScores((s) => s.map((x, j) => j === i ? v : x))} />
                  {l}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {scores[8] > 0 && <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">⚠ Q9 positive — safety assessment required regardless of total score.</div>}
      <ScoreBox score={`${total}/27`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function AUDITCCalc() {
  const [q1, setQ1] = useState(0); const [q2, setQ2] = useState(0); const [q3, setQ3] = useState(0);
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const score = q1 + q2 + q3;
  const threshold = sex === 'M' ? 4 : 3;
  const positive = score >= threshold;
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">AUDIT-C (Alcohol)</h3>
      <p className="text-xs text-gray-500 mb-4">Alcohol Use Disorders Identification Test — Consumption. Positive: Men ≥4, Women ≥3.</p>
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-600 mr-3">Patient sex:</label>
        {(['M', 'F'] as const).map((s) => (
          <label key={s} className="mr-3 text-sm cursor-pointer">
            <input type="radio" checked={sex === s} onChange={() => setSex(s)} className="accent-teal-600 mr-1" />{s === 'M' ? 'Male' : 'Female'}
          </label>
        ))}
      </div>
      <SelectRow label="Q1 — How often do you have a drink containing alcohol?" value={q1} onChange={setQ1}
        options={[{ v: 0, l: 'Never' }, { v: 1, l: 'Monthly or less' }, { v: 2, l: '2–4 times per month' }, { v: 3, l: '2–3 times per week' }, { v: 4, l: '4 or more times per week' }]} />
      <div className="mt-4">
        <SelectRow label="Q2 — How many standard drinks on a typical day when drinking?" value={q2} onChange={setQ2}
          options={[{ v: 0, l: '1–2' }, { v: 1, l: '3–4' }, { v: 2, l: '5–6' }, { v: 3, l: '7–9' }, { v: 4, l: '10 or more' }]} />
      </div>
      <div className="mt-4">
        <SelectRow label="Q3 — How often do you have 6 or more drinks on one occasion?" value={q3} onChange={setQ3}
          options={[{ v: 0, l: 'Never' }, { v: 1, l: 'Less than monthly' }, { v: 2, l: 'Monthly' }, { v: 3, l: 'Weekly' }, { v: 4, l: 'Daily or almost daily' }]} />
      </div>
      <ScoreBox score={`${score}/12`} label={positive ? `POSITIVE (≥${threshold}) — hazardous/harmful use, further assessment` : `Negative (<${threshold}) — low risk`} color={positive ? 'amber' : 'green'} />
    </Card>
  );
}

const IPSS_QUESTIONS = [
  'Incomplete emptying: Over the past month, how often have you had a sensation of not emptying your bladder completely after you finish urinating?',
  'Frequency: Over the past month, how often have you had to urinate again less than two hours after you finished urinating?',
  'Intermittency: Over the past month, how often have you found you stopped and started again several times when you urinated?',
  'Urgency: Over the past month, how often have you found it difficult to postpone urination?',
  'Weak stream: Over the past month, how often have you had a weak urinary stream?',
  'Straining: Over the past month, how often have you had to push or strain to begin urination?',
  'Nocturia: Over the past month, how many times did you most typically get up to urinate from the time you went to bed until the time you got up in the morning?',
];

function IPSSCalc() {
  const [scores, setScores] = useState<number[]>(Array(7).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const interp = total >= 20 ? { l: 'Severe symptoms (20-35)', c: 'red' as const } : total >= 8 ? { l: 'Moderate symptoms (8-19)', c: 'amber' as const } : { l: 'Mild symptoms (0-7)', c: 'green' as const };
  const labels7 = ['Not at all', '<1 in 5', '<Half', 'About half', '>Half', 'Almost always'];
  const labelsN = ['0 times', '1 time', '2 times', '3 times', '4 times', '5+ times'];
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">IPSS (Prostate Symptoms)</h3>
      <p className="text-xs text-gray-500 mb-4">International Prostate Symptom Score. 0-7 Mild, 8-19 Moderate, 20-35 Severe.</p>
      <div className="space-y-5">
        {IPSS_QUESTIONS.map((q, i) => {
          const labs = i === 6 ? labelsN : labels7;
          return (
            <div key={i}>
              <div className="text-sm text-gray-700 mb-2">{i + 1}. {q}</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {labs.map((l, v) => (
                  <label key={v} className={`text-center text-xs cursor-pointer px-1 py-2 rounded-lg border transition ${scores[i] === v ? 'bg-teal-600 text-white border-teal-600' : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}>
                    <input type="radio" className="sr-only" checked={scores[i] === v} onChange={() => setScores((s) => s.map((x, j) => j === i ? v : x))} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ScoreBox score={`${total}/35`} label={interp.l} color={interp.c} />
    </Card>
  );
}

function CentorCalc() {
  const [exudate, setExudate] = useState(false); const [lymph, setLymph] = useState(false);
  const [noCough, setNoCough] = useState(false); const [fever, setFever] = useState(false);
  const [ageGroup, setAgeGroup] = useState<0 | 1 | 2>(1);
  const ageScore = ageGroup === 0 ? 1 : ageGroup === 2 ? -1 : 0;
  const score = [exudate, lymph, noCough, fever].filter(Boolean).length + ageScore;
  const risk = score <= 0 ? '1-2.5%' : score === 1 ? '5-10%' : score === 2 ? '11-17%' : score === 3 ? '28-35%' : '51-53%';
  const action = score <= 1 ? 'No antibiotic / throat swab' : score <= 2 ? 'Consider rapid antigen test / throat swab' : 'Consider empiric antibiotic or rapid antigen test';
  const color = score >= 3 ? 'amber' as const : 'green' as const;
  return (
    <Card>
      <h3 className="text-base font-bold text-gray-800 mb-1">Centor / McIsaac Score</h3>
      <p className="text-xs text-gray-500 mb-4">Group A Streptococcal pharyngitis probability. Guides antibiotic decision in sore throat.</p>
      <div className="space-y-3">
        <CheckRow label="Tonsillar exudate" checked={exudate} onChange={setExudate} />
        <CheckRow label="Tender anterior cervical lymphadenopathy" checked={lymph} onChange={setLymph} />
        <CheckRow label="Absence of cough" checked={noCough} onChange={setNoCough} />
        <CheckRow label="History of fever (>38°C)" checked={fever} onChange={setFever} />
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1">Age</div>
          {[{ v: 0, l: '3–14 years (+1)' }, { v: 1, l: '15–44 years (0)' }, { v: 2, l: '≥45 years (−1)' }].map(({ v, l }) => (
            <label key={v} className="flex items-center gap-2 mb-1 cursor-pointer">
              <input type="radio" checked={ageGroup === v} onChange={() => setAgeGroup(v as 0 | 1 | 2)} className="accent-teal-600" />
              <span className="text-sm text-gray-700">{l}</span>
            </label>
          ))}
        </div>
      </div>
      <ScoreBox score={`${score} — GAS risk: ${risk}`} label={action} color={color} />
    </Card>
  );
}
