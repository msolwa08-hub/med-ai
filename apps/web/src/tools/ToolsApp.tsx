import { useEffect, useState } from 'react';
import {
  toolsApi,
  toolsKeyStore,
  type Urgency,
  type DischargeInput,
  type ReferralInput,
  type WardNoteInput,
} from './toolsApi';
import { formatDischarge, formatReferral, formatWardNote } from './formatDocs';

type View = 'gate' | 'home' | 'tool';
type Tool = 'discharge' | 'referral' | 'ward';

const SPECIALTIES = [
  'General / Internal Medicine',
  'Surgery',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Orthopaedics',
  'Emergency',
  'Psychiatry',
  'Family Medicine',
  'Other',
];

interface FieldCfg {
  key: string;
  label: string;
  type: 'text' | 'select' | 'textarea';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  full?: boolean;
}

const specialtyField: FieldCfg = { key: 'specialty', label: 'Specialty / rotation', type: 'select', options: SPECIALTIES, full: true };

const TOOL_META: Record<Tool, { title: string; blurb: string; fields: FieldCfg[] }> = {
  discharge: {
    title: 'Discharge Summary',
    blurb: "Turn the admission and course into a structured discharge summary.",
    fields: [
      specialtyField,
      { key: 'ageSex', label: 'Age & sex', type: 'text', placeholder: 'e.g. 34F' },
      { key: 'hospitalNumber', label: 'Hospital no.', type: 'text' },
      { key: 'ward', label: 'Ward / unit', type: 'text' },
      { key: 'admissionDate', label: 'Admitted', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'dischargeDate', label: 'Discharged', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'primaryDiagnosis', label: 'Primary diagnosis (optional)', type: 'text', full: true },
      { key: 'notes', label: 'Clinical course, investigations, treatment, plan — paste your notes', type: 'textarea', required: true, full: true, placeholder: 'Paste the admission clerking, ward notes, key results, treatment given, and discharge plan…' },
    ],
  },
  referral: {
    title: 'Referral Letter',
    blurb: 'Draft a referral with an explicit clinical question.',
    fields: [
      specialtyField,
      { key: 'ageSex', label: 'Age & sex', type: 'text', placeholder: 'e.g. 58M' },
      { key: 'hospitalNumber', label: 'Hospital no.', type: 'text' },
      { key: 'referTo', label: 'Refer to (specialty / unit)', type: 'text', required: true, placeholder: 'e.g. Cardiology' },
      { key: 'urgency', label: 'Urgency', type: 'select', options: ['ROUTINE', 'URGENT', 'EMERGENCY'] },
      { key: 'specificQuestion', label: 'Specific question (optional)', type: 'text', full: true, placeholder: 'What exactly are you asking them?' },
      { key: 'notes', label: 'Reason + relevant clinical details — paste your notes', type: 'textarea', required: true, full: true, placeholder: 'Paste the relevant history, examination, investigations and current management…' },
    ],
  },
  ward: {
    title: 'Daily Ward Note',
    blurb: 'Build today’s progress note + suggested labs from the previous days.',
    fields: [
      specialtyField,
      { key: 'ageSex', label: 'Age & sex', type: 'text', placeholder: 'e.g. 6yo M' },
      { key: 'hospitalNumber', label: 'Hospital no.', type: 'text' },
      { key: 'ward', label: 'Ward', type: 'text' },
      { key: 'hospitalDay', label: 'Hospital day', type: 'text', placeholder: 'e.g. Day 4 / POD 2' },
      { key: 'workingDiagnosis', label: 'Working diagnosis', type: 'text', full: true },
      { key: 'previousNotes', label: "Previous days' ward notes — paste", type: 'textarea', required: true, full: true, placeholder: 'Paste the running ward-round notes from previous days…' },
      { key: 'labResults', label: 'Lab results across days (optional) — paste', type: 'textarea', full: true, placeholder: 'Paste blood results from one or more days; trends will be picked up across them…' },
      { key: 'todayStatus', label: "Today's status / overnight events (optional)", type: 'textarea', full: true, placeholder: 'How is the patient today? Overnight events, new complaints, latest obs…' },
    ],
  },
};

export default function ToolsApp() {
  const [view, setView] = useState<View>('gate');
  const [toolsKey, setToolsKey] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('discharge');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const k = toolsKeyStore.get();
    if (k) { setToolsKey(k); setView('home'); }
    setLoading(false);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;

  if (view === 'gate' || !toolsKey) {
    return <ToolsGate onValidated={(k) => { toolsKeyStore.set(k); setToolsKey(k); setView('home'); }} />;
  }

  if (view === 'home') {
    return (
      <Home
        onPick={(t) => { setSelectedTool(t); setView('tool'); }}
        onSignOut={() => { toolsKeyStore.clear(); setToolsKey(null); setView('gate'); }}
      />
    );
  }

  return <ToolForm toolsKey={toolsKey} tool={selectedTool} onBack={() => setView('home')} />;
}

function ToolsGate({ onValidated }: { onValidated: (k: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setError(''); setLoading(true);
    try {
      const { valid } = await toolsApi.validate(key.trim());
      if (!valid) throw new Error('Invalid key');
      onValidated(key.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid key');
    } finally { setLoading(false); }
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Intern Tools</h1>
          <p className="text-sm text-gray-500 mt-1">Personal hospital document aide</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={submit} className="space-y-4">
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Your personal key" autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading || !key.trim()} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition">
              {loading ? 'Validating…' : 'Open tools'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Private aide · drafts must be reviewed &amp; signed</p>
      </div>
    </div>
  );
}

function Home({ onPick, onSignOut }: { onPick: (t: Tool) => void; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Intern Tools</div>
            <div className="text-xs text-gray-400">Personal hospital document aide</div>
          </div>
          <button onClick={onSignOut} className="text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {(Object.keys(TOOL_META) as Tool[]).map((t) => (
          <button key={t} onClick={() => onPick(t)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm p-5 transition">
            <div className="text-base font-semibold text-gray-900">{TOOL_META[t].title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{TOOL_META[t].blurb}</div>
          </button>
        ))}
        <p className="text-xs text-gray-400 pt-4">Works across specialties — set your rotation (Paeds, O&amp;G, Surgery…) on each document so the output uses the right conventions.</p>
      </div>
    </div>
  );
}

function ToolForm({ toolsKey, tool, onBack }: { toolsKey: string; tool: Tool; onBack: () => void }) {
  const meta = TOOL_META[tool];
  const [form, setForm] = useState<Record<string, string>>({ specialty: SPECIALTIES[0], urgency: 'ROUTINE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function generate() {
    const missing = meta.fields.find((f) => f.required && !(form[f.key] ?? '').trim());
    if (missing) { setError(`${missing.label} is required`); return; }
    setError(''); setLoading(true); setDoc(null);
    try {
      let text = '';
      if (tool === 'discharge') {
        const { document } = await toolsApi.discharge(toolsKey, form as unknown as DischargeInput);
        text = formatDischarge(document);
      } else if (tool === 'referral') {
        const input = { ...form, urgency: (form.urgency as Urgency) ?? 'ROUTINE' } as unknown as ReferralInput;
        const { document } = await toolsApi.referral(toolsKey, input);
        text = formatReferral(document);
      } else {
        const { document } = await toolsApi.wardNote(toolsKey, form as unknown as WardNoteInput);
        text = formatWardNote(document);
      }
      setDoc(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally { setLoading(false); }
  }

  async function copy() {
    if (!doc) return;
    await navigator.clipboard.writeText(doc);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1" aria-label="Back">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="text-sm font-semibold text-gray-900">{meta.title}</div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!doc ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meta.fields.map((f) => (
                <div key={f.key} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                  {f.type === 'select' ? (
                    <select value={form[f.key] ?? f.options?.[0] ?? ''} onChange={(e) => set(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea rows={f.key === 'notes' || f.key === 'previousNotes' ? 8 : 4} value={form[f.key] ?? ''} placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                  ) : (
                    <input type="text" value={form[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                </div>
              ))}
            </div>
            {error && <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button onClick={generate} disabled={loading}
              className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition">
              {loading ? 'Generating…' : `Generate ${meta.title.toLowerCase()}`}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 print:hidden">
              <p className="text-xs text-amber-800">DRAFT — review, correct, and sign before use. Edit freely below.</p>
            </div>
            <textarea value={doc} onChange={(e) => setDoc(e.target.value)} rows={24}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 print:hidden" />
            <pre className="hidden print:block whitespace-pre-wrap text-sm font-mono">{doc}</pre>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 print:hidden">
              <button onClick={() => setDoc(null)} className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition">Edit inputs</button>
              <button onClick={copy} className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition">{copied ? 'Copied ✓' : 'Copy'}</button>
              <button onClick={() => window.print()} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">Print</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
