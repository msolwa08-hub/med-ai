import { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import type { StoredSession } from '../storage';

interface Props {
  session: StoredSession;
  onMessage: (sessionId: string, patientMsg: string, aiReply: string, isComplete: boolean, summary?: string) => void;
  onViewSummary: () => void;
  onBackToList: () => void;
}

export function ChatView({ session, onMessage, onViewSummary, onBackToList }: Props) {
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
      onMessage(session.sessionId, text, result.reply, result.isComplete, result.summary);
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
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBackToList}
          className="text-gray-400 hover:text-gray-600 transition p-1 -ml-1 rounded-lg"
          aria-label="Back to sessions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{session.label}</div>
            <div className="text-xs text-gray-400">Sandton Family Practice</div>
          </div>
        </div>
        {session.isComplete && (
          <button
            onClick={onViewSummary}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition px-2 py-1 rounded flex-shrink-0"
          >
            Summary →
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3 bg-gray-50">
        {session.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'patient' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <span className="text-xs font-bold text-blue-700">AI</span>
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
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
              <span className="text-xs font-bold text-blue-700">AI</span>
            </div>
            <div className="chat-bubble-ai">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {/* Complete banner */}
        {session.isComplete && !loading && (
          <div className="flex justify-center py-2">
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center max-w-sm">
              <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-semibold mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History complete
              </div>
              <p className="text-xs text-green-600 mb-3">
                GP Clinical Summary has been generated.
              </p>
              <button
                onClick={onViewSummary}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
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
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Type your reply..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-xl flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
          <p className="text-center text-xs text-gray-400 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
