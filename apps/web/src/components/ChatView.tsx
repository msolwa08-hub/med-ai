import React, { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '../api';
import { storage } from '../storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  sessionId: string;
}

export default function ChatView({ sessionId }: Props) {
  // The live session id: starts as the ?s= link value (may be empty when the
  // patient arrives via the landing card) and is replaced by whatever
  // /beta/start returns.
  const [activeSessionId, setActiveSessionId] = useState(sessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [betaKey, setBetaKey] = useState(storage.getBetaKey());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function rememberSession(id: string) {
    setActiveSessionId(id);
    // Put the session in the URL so a refresh resumes instead of restarting.
    const url = new URL(window.location.href);
    url.searchParams.set('s', id);
    window.history.replaceState({}, '', url.toString());
  }

  async function startNewSession(key: string) {
    setStarting(true);
    setError('');
    try {
      const result = await api.startSession(key, {});
      rememberSession(result.sessionId);
      setMessages([{ role: 'assistant', content: result.message }]);
      setNeedsKey(false);
      storage.setBetaKey(key);
      setBetaKey(key);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setNeedsKey(true);
        setError(key ? 'That access key was not recognised — please check it and try again.' : '');
      } else {
        setError('Could not connect to MedAI. Check your internet connection and try again.');
      }
    } finally {
      setStarting(false);
    }
  }

  async function loadSession() {
    if (sessionId) {
      try {
        const session = await api.getSession(sessionId);
        setActiveSessionId(sessionId);
        setMessages(session.messages as Message[]);
        if (session.status === 'completed') setCompleted(true);
        setStarting(false);
        return;
      } catch {
        // Expired/unknown link — fall through and start fresh below.
      }
    }
    if (betaKey) {
      await startNewSession(betaKey);
    } else {
      setNeedsKey(true);
      setStarting(false);
    }
  }

  async function send() {
    if (!input.trim() || loading || completed || !activeSessionId) return;
    const userMsg = input.trim();
    const priorMessages = messages;
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      // Send the transcript along so the server can rebuild the session if it
      // restarted since the last turn.
      const result = await api.chat(betaKey, activeSessionId, userMsg, priorMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
      if (result.completed) setCompleted(true);
    } catch {
      // Give the patient their message back so nothing they typed is lost.
      setMessages(priorMessages);
      setInput(userMsg);
      setError('That message did not go through — press Send to try again.');
    } finally {
      setLoading(false);
    }
  }

  if (needsKey) {
    return (
      <div className="min-h-screen bg-surface-alt flex items-center justify-center p-6">
        <div className="bg-surface border border-line shadow-sm rounded-3xl p-8 w-full max-w-sm text-center">
          <img src="/medai-icon.svg" alt="MedAI" className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-ink text-xl font-semibold mb-1">MedAI Patient History</h2>
          <p className="text-ink-mute text-sm mb-6">Enter the access key your clinic gave you.</p>
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && keyInput.trim() && startNewSession(keyInput.trim())}
            placeholder="Access key"
            autoFocus
            className="w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-ink placeholder:text-ink-mute text-sm focus:outline-none focus:border-brand-500 focus:shadow-focus mb-3"
          />
          <button
            onClick={() => keyInput.trim() && startNewSession(keyInput.trim())}
            disabled={!keyInput.trim() || starting}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {starting ? 'Starting…' : 'Start'}
          </button>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">
      <header className="bg-surface border-b border-line px-4 py-3 flex items-center gap-3">
        <img src="/medai-icon.svg" alt="MedAI" className="w-8 h-8" />
        <div>
          <h1 className="text-ink font-semibold text-sm">MedAI Patient History</h1>
          <p className="text-ink-mute text-xs">AI-assisted medical history taking</p>
        </div>
        {completed && (
          <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
            Completed
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {starting && messages.length === 0 && (
          <div className="text-center py-16 text-ink-mute">
            <div className="flex justify-center gap-1 mb-3">
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-brand-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm">Getting ready…</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-surface-alt text-ink rounded-bl-sm'
              }`}
            >
              {m.content.replace(/```json[\s\S]*?```/g, '').trim()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-alt rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {completed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-emerald-700 text-sm font-medium">History taking complete</p>
            <p className="text-emerald-600/70 text-xs mt-1">Your doctor can now review your history.</p>
          </div>
        )}
        {error && !starting && (
          <div className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
            {messages.length === 0 && (
              <button
                onClick={() => (betaKey ? startNewSession(betaKey) : setNeedsKey(true))}
                className="mt-2 text-brand-600 text-sm hover:text-brand-700 font-medium"
              >
                Try again
              </button>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!completed && (
        <div className="bg-surface border-t border-line p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type your response..."
              disabled={starting || !activeSessionId}
              className="flex-1 bg-surface border border-line-strong rounded-xl px-4 py-3 text-ink placeholder:text-ink-mute text-sm focus:outline-none focus:border-brand-500 focus:shadow-focus disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || starting || !input.trim() || !activeSessionId}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-ink-mute text-xs text-center mt-2">
            This is an AI assistant. Provide accurate information for the best care.
          </p>
        </div>
      )}
    </div>
  );
}
