import { useEffect, useState } from 'react';
import { cockpitApi, doctorKeyStore, type ConsultListItem, type ConsultStatus } from './cockpitApi';
import { ConsultWorkspace } from './ConsultWorkspace';

type View = 'gate' | 'list' | 'workspace';

const statusMeta: Record<ConsultStatus, { label: string; cls: string }> = {
  TAKING_HISTORY: { label: 'Taking history', cls: 'bg-gray-100 text-gray-600' },
  AWAITING_DOCTOR: { label: 'Awaiting doctor', cls: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'In review', cls: 'bg-amber-100 text-amber-700' },
  SIGNED: { label: 'Signed', cls: 'bg-green-100 text-green-700' },
};

export default function DoctorApp() {
  const [view, setView] = useState<View>('gate');
  const [doctorKey, setDoctorKey] = useState<string | null>(null);
  const [consults, setConsults] = useState<ConsultListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = doctorKeyStore.get();
    if (key) {
      setDoctorKey(key);
      setView('list');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  }

  if (view === 'gate' || !doctorKey) {
    return (
      <DoctorGate
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

function DoctorGate({ onValidated }: { onValidated: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedAI Cockpit</h1>
          <p className="text-sm text-gray-500 mt-1">Doctor console — Sandton Family Practice</p>
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono text-center tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition"
            />
            {error && <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading || !key.trim()} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold rounded-xl transition">
              {loading ? 'Validating…' : 'Open console'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">MedAI Cockpit · Beta</p>
      </div>
    </div>
  );
}

function ConsultList({
  doctorKey,
  consults,
  setConsults,
  onOpen,
  onSignOut,
}: {
  doctorKey: string;
  consults: ConsultListItem[];
  setConsults: (c: ConsultListItem[]) => void;
  onOpen: (id: string) => void;
  onSignOut: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Consultations</div>
            <div className="text-xs text-gray-400">Sandton Family Practice</div>
          </div>
          <div className="flex items-center gap-2">
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
                  className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm p-4 transition flex items-center gap-3"
                >
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
    </div>
  );
}
