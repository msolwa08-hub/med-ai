import React from 'react';
import { RefreshCw } from 'lucide-react';
import { SummaryView } from '../components/SummaryView';
import { Spinner } from '../components/ui';

interface Props {
  doctorKey: string;
  sessionId: string;
  onBack: () => void;
}

interface FullSession {
  id: string;
  status: string;
  department?: string;
  ageSex?: string;
  summary?: string;
  complaints?: string[];
  history?: string;
  messages: { role: string; content: string; timestamp?: string }[];
}

export function ConsultWorkspace({ doctorKey, sessionId, onBack }: Props) {
  const [session, setSession] = React.useState<FullSession | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  function load() {
    setLoading(true);
    setError('');
    fetch(`/cockpit/sessions/${sessionId}`, {
      headers: { 'x-doctor-key': doctorKey },
    })
      .then(r => r.json())
      .then(setSession)
      .catch(() => setError('Unable to load session — check your connection.'))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { load(); }, [sessionId, doctorKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <Spinner className="w-5 h-5 text-brand-600" />
        <span className="text-sm text-ink-soft">Loading session…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-danger text-sm mb-3">{error}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!session) return null;

  return <SummaryView session={session} onBack={onBack} />;
}
