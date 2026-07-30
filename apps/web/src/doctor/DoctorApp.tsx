import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { AccessKeyGate } from '../components/AccessKeyGate';
import { SessionListView } from '../components/SessionListView';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ConsultWorkspace } from './ConsultWorkspace';
import { cockpitApi } from './cockpitApi';
import { storage } from '../storage';
import { Spinner } from '../components/ui';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (key) {
      storage.setDoctorKey(key);
      loadData();
    }
  }, [key]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [s, a] = await Promise.all([
        cockpitApi.sessions(key),
        cockpitApi.analytics(key),
      ]);
      setSessions(s.sessions);
      setAnalytics(a);
    } catch {
      setError('Unable to load data — check your connection and try again.');
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
        <button
          onClick={onBack}
          aria-label="Back"
          className="shrink-0 grid place-items-center w-11 h-11 -ml-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <img src="/medai-icon.svg" alt="" className="w-7 h-7" />
        <span className="text-ink font-semibold">Doctor Cockpit</span>
        <button
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh"
          className="ml-auto shrink-0 grid place-items-center w-11 h-11 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex border-b border-line bg-surface" role="tablist">
        {(['sessions', 'analytics'] as Tab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 min-h-[44px] text-sm font-medium transition-colors capitalize ${
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
        {error && (
          <div className="text-center py-12">
            <p className="text-danger text-sm mb-3">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        )}
        {loading && !error && (
          <div className="flex items-center justify-center gap-3 py-16">
            <Spinner className="w-5 h-5 text-brand-600" />
            <span className="text-sm text-ink-soft">Loading sessions…</span>
          </div>
        )}
        {!loading && !error && tab === 'sessions' && (
          <SessionListView
            sessions={sessions as never}
            onSelect={setSelectedId}
          />
        )}
        {!loading && !error && tab === 'analytics' && analytics && (
          <AnalyticsDashboard analytics={analytics} />
        )}
      </div>
    </div>
  );
}
