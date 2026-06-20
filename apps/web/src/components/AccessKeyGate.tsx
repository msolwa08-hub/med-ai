import { useState } from 'react';
import { api } from '../api';

interface Props {
  onValidated: (key: string) => void;
}

export function AccessKeyGate({ onValidated }: Props) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setError('');
    setLoading(true);
    try {
      const result = await api.validate(key.trim());
      if (!result.valid) throw new Error('Invalid access key');
      onValidated(key.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid access key. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ background: 'linear-gradient(160deg, #f0fdfa 0%, #ffffff 60%, #f0fdfa 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl mb-5 shadow-md"
               style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', width: 72, height: 72 }}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MedAI</h1>
          <p className="text-sm text-teal-600 mt-1 font-medium">Sandton Family Practice</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-teal-100 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Welcome</h2>
          <p className="text-sm text-slate-500 mb-5">Enter your practice access key to begin.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="MEDAI-BETA-XXXX"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-2xl border border-teal-100 text-sm font-mono text-center tracking-wider placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:bg-teal-50 transition"
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !key.trim()}
              className="w-full py-3 text-white text-sm font-semibold rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:opacity-50 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating…
                </span>
              ) : 'Continue'}
            </button>
          </form>

          {/* Privacy reassurance */}
          <div className="mt-5 flex items-start gap-2.5 bg-teal-50 rounded-2xl px-4 py-3 border border-teal-100">
            <svg className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs text-teal-700 leading-relaxed">
              Everything you share is <strong>completely private</strong> and only seen by your doctor. We never share your information.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sandton Family Practice · MedAI Beta
        </p>
      </div>
    </div>
  );
}
