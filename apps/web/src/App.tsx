import { useState, useEffect } from 'react';
import { AccessKeyGate } from './components/AccessKeyGate';
import { ChatView } from './components/ChatView';
import { SummaryView } from './components/SummaryView';
import { api } from './api';

export type AppView = 'gate' | 'chat' | 'summary';

export interface ChatMessage {
  role: 'assistant' | 'patient';
  content: string;
  timestamp: string;
}

const STORAGE_KEY = 'medai_beta_session';

interface StoredSession {
  sessionId: string;
  messages: ChatMessage[];
  isComplete: boolean;
  summary?: string;
}

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [view, setView] = useState<AppView>('gate');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      api.checkStatus(stored.sessionId)
        .then((status) => {
          if (status.isValid) {
            setSessionId(stored.sessionId);
            setMessages(stored.messages);
            setIsComplete(stored.isComplete);
            setSummary(stored.summary ?? null);
            setView(stored.isComplete ? 'summary' : 'chat');
          } else {
            clearSession();
          }
        })
        .catch(() => clearSession())
        .finally(() => setRestoring(false));
    } else {
      setRestoring(false);
    }
  }, []);

  function handleSessionStart(sid: string, openingMessage: string) {
    const firstMsg: ChatMessage = {
      role: 'assistant',
      content: openingMessage,
      timestamp: new Date().toISOString(),
    };
    setSessionId(sid);
    setMessages([firstMsg]);
    setIsComplete(false);
    setSummary(null);
    setView('chat');
    saveSession({ sessionId: sid, messages: [firstMsg], isComplete: false });
  }

  function handleNewMessage(patientMessage: string, aiReply: string, complete: boolean, sum?: string) {
    const updated: ChatMessage[] = [
      ...messages,
      { role: 'patient', content: patientMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiReply, timestamp: new Date().toISOString() },
    ];
    setMessages(updated);
    setIsComplete(complete);
    if (sum) setSummary(sum);
    saveSession({
      sessionId: sessionId!,
      messages: updated,
      isComplete: complete,
      summary: sum,
    });
    if (complete) setView('summary');
  }

  function handleReset() {
    clearSession();
    setSessionId(null);
    setMessages([]);
    setIsComplete(false);
    setSummary(null);
    setView('gate');
  }

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'gate' && (
        <AccessKeyGate onStart={handleSessionStart} />
      )}
      {view === 'chat' && sessionId && (
        <ChatView
          sessionId={sessionId}
          messages={messages}
          isComplete={isComplete}
          onMessage={handleNewMessage}
          onViewSummary={() => setView('summary')}
          onReset={handleReset}
        />
      )}
      {view === 'summary' && (
        <SummaryView
          sessionId={sessionId!}
          summary={summary}
          onBack={() => setView('chat')}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
