import { useState, useEffect } from 'react';
import { storage, type StoredSession } from './storage';
import { AccessKeyGate } from './components/AccessKeyGate';
import { SessionListView } from './components/SessionListView';
import { ChatView } from './components/ChatView';
import { SummaryView } from './components/SummaryView';
import { api } from './api';

type AppView = 'gate' | 'sessions' | 'chat' | 'summary';

export default function App() {
  const [view, setView] = useState<AppView>('gate');
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = storage.getAccessKey();
    if (key) {
      setAccessKey(key);
      setSessions(storage.getSessions());
      setView('sessions');
    }
    setLoading(false);
  }, []);

  function refreshSessions() {
    setSessions(storage.getSessions());
  }

  function handleKeyValidated(key: string) {
    storage.saveAccessKey(key);
    setAccessKey(key);
    setSessions(storage.getSessions());
    setView('sessions');
  }

  async function handleNewSession() {
    if (!accessKey) return;
    try {
      const result = await api.startSession(accessKey);
      storage.createSession(result.sessionId);
      storage.addMessage(result.sessionId, {
        role: 'assistant',
        content: result.message,
        timestamp: new Date().toISOString(),
      });
      setCurrentSessionId(result.sessionId);
      refreshSessions();
      setView('chat');
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('invalid')) {
        storage.clearAll();
        setAccessKey(null);
        setView('gate');
      }
    }
  }

  function handleOpenSession(sessionId: string) {
    const session = storage.getSession(sessionId);
    if (!session) return;
    setCurrentSessionId(sessionId);
    setView(session.isComplete ? 'summary' : 'chat');
  }

  function handleMessage(
    sessionId: string,
    patientMsg: string,
    aiReply: string,
    isComplete: boolean,
    summary?: string,
  ) {
    storage.addMessage(sessionId, {
      role: 'patient',
      content: patientMsg,
      timestamp: new Date().toISOString(),
    });
    storage.addMessage(sessionId, {
      role: 'assistant',
      content: aiReply,
      timestamp: new Date().toISOString(),
    });
    if (isComplete && summary) {
      storage.completeSession(sessionId, summary);
      refreshSessions();
      setView('summary');
    } else {
      refreshSessions();
    }
  }

  function handleBackToList() {
    setCurrentSessionId(null);
    refreshSessions();
    setView('sessions');
  }

  function handleSignOut() {
    storage.clearAll();
    setAccessKey(null);
    setSessions([]);
    setCurrentSessionId(null);
    setView('gate');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const currentSession = currentSessionId ? storage.getSession(currentSessionId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'gate' && (
        <AccessKeyGate onValidated={handleKeyValidated} />
      )}
      {view === 'sessions' && (
        <SessionListView
          sessions={sessions}
          onNew={handleNewSession}
          onOpen={handleOpenSession}
          onSignOut={handleSignOut}
          onRename={(id, label) => { storage.renameSession(id, label); refreshSessions(); }}
        />
      )}
      {view === 'chat' && currentSession && (
        <ChatView
          session={currentSession}
          onMessage={handleMessage}
          onViewSummary={() => setView('summary')}
          onBackToList={handleBackToList}
        />
      )}
      {view === 'summary' && currentSession && (
        <SummaryView
          session={currentSession}
          onBack={() => setView('chat')}
          onBackToList={handleBackToList}
          onApprove={() => { storage.approveSession(currentSession.sessionId); refreshSessions(); }}
          onSaveNotes={(notes) => { storage.saveNotes(currentSession.sessionId, notes); refreshSessions(); }}
          onNewPatient={handleNewSession}
        />
      )}
    </div>
  );
}
