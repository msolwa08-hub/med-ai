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
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="bg-surface rounded-card p-8 w-full max-w-sm shadow-elevated border border-line">
        <div className="flex justify-center mb-6">
          <img src="/medai-icon.svg" alt="" className="w-12 h-12" />
        </div>
        <h2 className="text-ink text-xl font-semibold text-center mb-1 tracking-tight">MedAI</h2>
        <p className="text-ink-soft text-sm text-center mb-6">{label}</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter access key"
            className="w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-[15px] text-ink placeholder:text-ink-mute transition-shadow focus:outline-none focus:border-brand-500 focus:shadow-focus"
            autoFocus
          />
          {error && <p className="text-band-exclude text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !input}
            className="w-full bg-brand-700 hover:bg-brand-600 active:bg-brand-800 disabled:opacity-50 text-white font-medium py-3 min-h-[44px] rounded-xl transition-colors shadow-card focus:outline-none focus-visible:shadow-focus"
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
