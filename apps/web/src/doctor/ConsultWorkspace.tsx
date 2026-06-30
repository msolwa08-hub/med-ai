import React from 'react';
import { SummaryView } from '../components/SummaryView';

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

  React.useEffect(() => {
    fetch(`/cockpit/sessions/${sessionId}`, {
      headers: { 'x-doctor-key': doctorKey },
    })
      .then(r => r.json())
      .then(setSession)
      .catch(() => setError('Failed to load session'))
      .finally(() => setLoading(false));
  }, [sessionId, doctorKey]);

  if (loading) return <div className="text-slate-400 text-center py-16">Loading...</div>;
  if (error) return <div className="text-red-400 text-center py-16">{error}</div>;
  if (!session) return null;

  return <SummaryView session={session} onBack={onBack} />;
}
