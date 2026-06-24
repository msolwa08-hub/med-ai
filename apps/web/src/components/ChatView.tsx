import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import type { StoredSession } from '../storage';

interface Props {
  session: StoredSession;
  onMessage: (sessionId: string, patientMsg: string, aiReply: string, isComplete: boolean) => void;
  onViewSummary: () => void;
  onBackToList: () => void;
  practiceName?: string;
}

export function ChatView({ session, onMessage, onViewSummary, onBackToList, practiceName = 'MedAI' }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, loading]);

  useEffect(() => {
    if (!loading && !session.isComplete) {
      inputRef.current?.focus();
    }
  }, [loading, session.isComplete]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || session.isComplete) return;
    setInput('');
    setError('');
    setLoading(true);
    try {
      const result = await api.sendMessage(session.sessionId, text);
      onMessage(session.sessionId, text, result.reply, result.isComplete);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('expired')) {
        setError('This session has expired (server restarted). Please go back and start a new patient session.');
      } else {
        setError(msg || 'Connection error. Please try again.');
      }
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-teal-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBackToList}
          className="text-slate-400 hover:text-teal-600 transition p-1 -ml-1 rounded-xl"
          aria-label="Back to sessions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
               style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{session.label}</div>
            <div className="text-xs text-teal-600">{practiceName}</div>
          </div>
        </div>
        {session.isComplete && (
          <button
            onClick={onViewSummary}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold transition px-2 py-1 rounded-xl flex-shrink-0"
          >
            Summary →
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3 bg-teal-50/30">
        {session.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm"
                   style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
            )}
            <div className={msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-patient'}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm"
                 style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div className="chat-bubble-ai">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {/* Complete banner */}
        {session.isComplete && !loading && (
          <div className="flex justify-center py-2">
            <div className="rounded-2xl px-4 py-3 text-center max-w-sm shadow-sm border border-emerald-100"
                 style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}>
              <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History complete
              </div>
              <p className="text-xs text-emerald-600 mb-3">GP Clinical Summary has been generated.</p>
              <button
                onClick={onViewSummary}
                className="w-full py-2 px-4 text-white text-sm font-semibold rounded-xl transition shadow-sm"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                View Clinical Summary →
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      {!session.isComplete && (
        <div className="flex-shrink-0 bg-white border-t border-teal-100 px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Type your reply…"
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-2xl border border-teal-100 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:bg-teal-50 disabled:text-slate-400 transition max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-10 h-10 text-white rounded-2xl flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:opacity-40 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
