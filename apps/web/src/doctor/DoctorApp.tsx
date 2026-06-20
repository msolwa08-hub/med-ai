import { useEffect, useState } from 'react';
import { cockpitApi, doctorKeyStore, type ConsultListItem, type ConsultStatus } from './cockpitApi';
import { ConsultWorkspace } from './ConsultWorkspace';

// ─── Practice settings ────────────────────────────────────────────────────────

export type PracticeMode = 'ACUTE_VOLUME' | 'FAMILY_PRACTICE' | 'HOLISTIC';

export interface PracticeSettings {
  primaryColor: string;
  focusMode: PracticeMode;
  practiceName: string;
}

const DEFAULT_SETTINGS: PracticeSettings = {
  primaryColor: '#059669',
  focusMode: 'FAMILY_PRACTICE',
  practiceName: 'Sandton Family Practice',
};

const SETTINGS_KEY = 'practice_settings';

export const practiceSettingsStore = {
  get: (): PracticeSettings => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  },
  set: (s: PracticeSettings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)),
};

// ─── Color helpers ────────────────────────────────────────────────────────────

function colorStyle(color: string) {
  return { background: color };
}
function colorBorderStyle(color: string) {
  return { borderColor: color, color };
}

const PRESET_COLORS = [
  { label: 'Teal', value: '#0d9488' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Slate', value: '#475569' },
];

const FOCUS_MODES: { id: PracticeMode; label: string; blurb: string; icon: string }[] = [
  {
    id: 'ACUTE_VOLUME',
    label: 'Acute / Volume',
    blurb: 'High-throughput, acute-first. AI skips health promotion; prioritises immediate management, rapid risk stratification, and concise scripts.',
    icon: '⚡',
  },
  {
    id: 'FAMILY_PRACTICE',
    label: 'Family Practice',
    blurb: 'Continuity care. AI surfaces chronic disease review, opportunistic screening, relationship-based follow-up, and long-term medication considerations.',
    icon: '🏡',
  },
  {
    id: 'HOLISTIC',
    label: 'Holistic',
    blurb: 'Bio-psycho-social approach. AI emphasises mental health screening, lifestyle factors, social determinants, and patient empowerment.',
    icon: '🌿',
  },
];

// ─── Status meta ─────────────────────────────────────────────────────────────

type View = 'gate' | 'list' | 'workspace';

const statusMeta: Record<ConsultStatus, { label: string; cls: string }> = {
  TAKING_HISTORY: { label: 'Taking history', cls: 'bg-gray-100 text-gray-600' },
  AWAITING_DOCTOR: { label: 'Awaiting doctor', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'In review', cls: 'bg-amber-100 text-amber-700' },
  SIGNED: { label: 'Signed', cls: 'bg-green-100 text-green-700' },
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function DoctorApp() {
  const [view, setView] = useState<View>('gate');
  const [doctorKey, setDoctorKey] = useState<string | null>(null);
  const [consults, setConsults] = useState<ConsultListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = doctorKeyStore.get();
    if (key) {
      setDoctorKey(key);
      setView('list');
    }
    setSettings(practiceSettingsStore.get());
    setLoading(false);
  }, []);

  function saveSettings(s: PracticeSettings) {
    setSettings(s);
    practiceSettingsStore.set(s);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  if (view === 'gate' || !doctorKey) {
    return (
      <DoctorGate
        settings={settings}
        onValidated={(key) => {
          doctorKeyStore.set(key);
          setDoctorKey(key);
          setView('list');
        }}
      />
    );
  }

  if (view === 'workspace' && selectedId) {
    return (
      <ConsultWorkspace
        doctorKey={doctorKey}
        consultId={selectedId}
        practiceMode={settings.focusMode}
        onBack={() => {
          setSelectedId(null);
          setView('list');
        }}
      />
    );
  }

  return (
    <ConsultList
      doctorKey={doctorKey}
      settings={settings}
      onSaveSettings={saveSettings}
      consults={consults}
      setConsults={setConsults}
      onOpen={(id) => {
        setSelectedId(id);
        setView('workspace');
      }}
      onSignOut={() => {
        doctorKeyStore.clear();
        setDoctorKey(null);
        setConsults([]);
        setView('gate');
      }}
    />
  );
}

// ─── Gate ─────────────────────────────────────────────────────────────────────

function DoctorGate({ settings, onValidated }: { settings: PracticeSettings; onValidated: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pc = settings.primaryColor;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { valid } = await cockpitApi.validate(key.trim());
      if (!valid) throw new Error('Invalid doctor key');
      onValidated(key.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid doctor key');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg" style={colorStyle(pc)}>
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedAI Cockpit</h1>
          <p className="text-sm text-gray-500 mt-1">Doctor console — {settings.practiceName}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Enter your doctor key</h2>
          <p className="text-sm text-gray-500 mb-5">For clinicians only. Patients use the main link.</p>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="MEDAI-DOC-XXXX"
              disabled={loading}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono text-center tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 transition"
              style={{ ['--tw-ring-color' as string]: pc }}
            />
            {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading || !key.trim()}
              className="w-full py-3 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
              style={colorStyle(pc)}>
              {loading ? 'Validating…' : 'Open console'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">MedAI Cockpit · Beta</p>
      </div>
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({ settings, onSave, onClose }: {
  settings: PracticeSettings;
  onSave: (s: PracticeSettings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PracticeSettings>({ ...settings });
  const pc = draft.primaryColor;

  function save() { onSave(draft); onClose(); }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-end z-50">
      <div className="h-full w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">Practice Settings</div>
            <div className="text-xs text-gray-400 mt-0.5">Customise your cockpit</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Practice name */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Practice / clinic name</label>
            <input type="text" value={draft.practiceName}
              onChange={(e) => setDraft((d) => ({ ...d, practiceName: e.target.value }))}
              placeholder="e.g. Sandton Family Practice"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              style={{ ['--tw-ring-color' as string]: pc }} />
          </div>

          {/* Color scheme */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-3">Practice colour</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button key={c.value} onClick={() => setDraft((d) => ({ ...d, primaryColor: c.value }))}
                  title={c.label}
                  className={`h-9 rounded-xl transition border-2 ${draft.primaryColor === c.value ? 'border-gray-800 scale-95' : 'border-transparent'}`}
                  style={colorStyle(c.value)} />
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Custom hex</label>
              <div className="flex gap-2">
                <div className="w-9 h-9 rounded-xl border border-gray-200 flex-shrink-0" style={colorStyle(draft.primaryColor)} />
                <input type="text" value={draft.primaryColor}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setDraft((d) => ({ ...d, primaryColor: v }));
                  }}
                  maxLength={7}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as string]: pc }}
                  placeholder="#059669" />
              </div>
            </div>
          </div>

          {/* Focus mode */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">AI focus mode</label>
            <p className="text-xs text-gray-400 mb-3">Shapes how the AI generates clinical packages for your consultations.</p>
            <div className="space-y-2">
              {FOCUS_MODES.map((m) => (
                <button key={m.id} onClick={() => setDraft((d) => ({ ...d, focusMode: m.id }))}
                  className={`w-full text-left p-3 rounded-xl border-2 transition ${draft.focusMode === m.id ? 'border-current bg-opacity-5' : 'border-gray-100 hover:border-gray-200'}`}
                  style={draft.focusMode === m.id ? colorBorderStyle(pc) : {}}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-base leading-none">{m.icon}</span>
                    <span className="text-sm font-semibold text-gray-900">{m.label}</span>
                    {draft.focusMode === m.id && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={colorStyle(pc)}>Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.blurb}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={save} className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition" style={colorStyle(pc)}>Save settings</button>
        </div>
      </div>
    </div>
  );
}

// ─── Consult list ─────────────────────────────────────────────────────────────

function ConsultList({
  doctorKey, settings, onSaveSettings, consults, setConsults, onOpen, onSignOut,
}: {
  doctorKey: string;
  settings: PracticeSettings;
  onSaveSettings: (s: PracticeSettings) => void;
  consults: ConsultListItem[];
  setConsults: (c: ConsultListItem[]) => void;
  onOpen: (id: string) => void;
  onSignOut: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const pc = settings.primaryColor;

  async function refresh() {
    setError('');
    try {
      const { consults: list } = await cockpitApi.listConsults(doctorKey);
      setConsults(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consults');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusMeta = FOCUS_MODES.find((m) => m.id === settings.focusMode);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Consultations</div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span>{settings.practiceName || 'My Practice'}</span>
              {focusMeta && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="font-medium" style={{ color: pc }}>{focusMeta.icon} {focusMeta.label}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(true)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              title="Practice settings">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button onClick={refresh} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Refresh</button>
            <button onClick={onSignOut} className="text-xs px-3 py-1.5 text-gray-400 hover:text-gray-600 transition">Sign out</button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading consults…</p>
        ) : consults.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-500">No consultations yet.</p>
            <p className="text-xs text-gray-400 mt-1">Patient histories will appear here as they complete them.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {consults.map((c) => {
              const meta = statusMeta[c.consultStatus];
              return (
                <button
                  key={c.sessionId}
                  onClick={() => onOpen(c.sessionId)}
                  className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm p-4 transition flex items-center gap-3"
                  style={{ ['--hover-border-color' as string]: pc }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.chiefComplaint}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(c.completedAt ?? c.createdAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${meta.cls}`}>{meta.label}</span>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsPanel settings={settings} onSave={onSaveSettings} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
