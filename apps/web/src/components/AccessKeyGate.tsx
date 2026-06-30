import React, { useState } from 'react';

interface Props {
  label: string;
  storageKey: string;
  onKey: (key: string) => void;
  validate: (key: string) => Promise<boolean>;
}

export function AccessKeyGate({ label, onKey, validate }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await validate(input.trim());
      if (ok) {
        onKey(input.trim());
      } else {
        setError('Invalid access key. Please try again.');
      }
    } catch {
      setError('Could not connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex justify-center mb-6">
          <img src="/medai-icon.svg" alt="MedAI" className="w-12 h-12" />
        </div>
        <h2 className="text-white text-xl font-semibold text-center mb-1">MedAI</h2>
        <p className="text-slate-400 text-sm text-center mb-6">{label}</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter access key"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !input}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
