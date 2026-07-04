import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { storage } from '../storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  sessionId: string;
}

export default function ChatView({ sessionId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [betaKey, setBetaKey] = useState(storage.getBetaKey() || 'MEDAI-BETA-DEV');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadSession() {
    try {
      const session = await api.getSession(sessionId);
      setMessages(session.messages as Message[]);
      if (session.status === 'completed') setCompleted(true);
    } catch {
      // New session — start with a greeting message
      try {
        const result = await api.startSession(betaKey, {});
        setMessages([{ role: 'assistant', content: result.message }]);
      } catch (e) {
        setError('Could not connect to MedAI server.');
      }
    }
  }

  async function send() {
    if (!input.trim() || loading || completed) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const result = await api.chat(betaKey, sessionId, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
      if (result.completed) setCompleted(true);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <img src="/medai-icon.svg" alt="MedAI" className="w-8 h-8" />
        <div>
          <h1 className="text-gray-900 font-semibold text-sm">MedAI Patient History</h1>
          <p className="text-gray-500 text-xs">AI-assisted medical history taking</p>
        </div>
        {completed && (
          <span className="ml-auto bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
            Completed
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.content.replace(/```json[\s\S]*?```/g, '').trim()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
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
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {!completed && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Type your response..."
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-gray-400 text-xs text-center mt-2">
            This is an AI assistant. Provide accurate information for the best care.
          </p>
        </div>
      )}
    </div>
  );
}
