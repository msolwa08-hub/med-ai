import React, { useState, useEffect } from 'react';
import { AccessKeyGate } from '../components/AccessKeyGate';
import { SessionListView } from '../components/SessionListView';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ConsultWorkspace } from './ConsultWorkspace';
import { cockpitApi } from './cockpitApi';
import { storage } from '../storage';

interface Props {
  onBack: () => void;
}

type Tab = 'sessions' | 'analytics';

export function DoctorApp({ onBack }: Props) {
  const [key, setKey] = useState(storage.getDoctorKey());
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<unknown[]>([]);
  const [analytics, setAnalytics] = useState<{ total: number; completed: number; active: number; byDepartment: Record<string, number> } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (key) {
      storage.setDoctorKey(key);
      loadData();
    }
  }, [key]);

  async function loadData() {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        cockpitApi.sessions(key),
        cockpitApi.analytics(key),
      ]);
      setSessions(s.sessions);
      setAnalytics(a);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!key) {
    return (
      <AccessKeyGate
        label="Doctor Cockpit — enter your doctor key"
        storageKey="medai_doctor_key"
        onKey={setKey}
        validate={cockpitApi.validate}
      />
    );
  }

  if (selectedId) {
    return (
      <div className="min-h-screen bg-surface-alt p-4">
        <div className="max-w-3xl mx-auto">
          <ConsultWorkspace
            doctorKey={key}
            sessionId={selectedId}
            onBack={() => setSelectedId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="bg-surface border-b border-line px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-ink-mute hover:text-ink transition-colors mr-2">
          ←
        </button>
        <img src="/medai-icon.svg" alt="" className="w-7 h-7" />
        <span className="text-ink font-semibold">Doctor Cockpit</span>
        <button
          onClick={loadData}
          disabled={loading}
          className="ml-auto text-ink-mute hover:text-ink text-sm transition-colors"
        >
          {loading ? '...' : '↻ Refresh'}
        </button>
      </header>

      <div className="flex border-b border-line bg-surface">
        {(['sessions', 'analytics'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? 'text-brand-700 border-b-2 border-brand-500'
                : 'text-ink-mute hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {tab === 'sessions' && (
          <SessionListView
            sessions={sessions as never}
            onSelect={setSelectedId}
          />
        )}
        {tab === 'analytics' && analytics && (
          <AnalyticsDashboard analytics={analytics} />
        )}
      </div>
    </div>
  );
}
