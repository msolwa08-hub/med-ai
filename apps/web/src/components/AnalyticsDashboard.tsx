import { useState } from 'react';
import type { AnalyticsData } from '../api';
import { api } from '../api';

interface Props {
  onBack: () => void;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 text-right text-xs text-gray-500 flex-shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-6 text-xs font-semibold text-gray-700 flex-shrink-0">{value}</div>
    </div>
  );
}

function DayBar({ date, count, max }: { date: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short' });
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs font-semibold text-gray-700">{count}</div>
      <div className="w-8 bg-gray-100 rounded-t-sm overflow-hidden" style={{ height: 64 }}>
        <div
          className="w-full bg-blue-500 rounded-t-sm transition-all"
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

export function AnalyticsDashboard({ onBack }: Props) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.getAnalytics(key.trim());
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
  }

  const maxDay = data ? Math.max(...data.userGrowth.dailySessions.map((d) => d.count), 1) : 1;
  const maxDist = data ? Math.max(...Object.values(data.aiHistoryQuality.exchangeDistribution), 1) : 1;
  const totalFunnel = data
    ? data.consultationFunnel.TAKING_HISTORY +
      data.consultationFunnel.AWAITING_DOCTOR +
      data.consultationFunnel.IN_REVIEW +
      data.consultationFunnel.SIGNED +
      data.consultationFunnel.abandoned
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <div className="text-sm font-bold text-gray-900">Analytics Dashboard</div>
            <div className="text-xs text-gray-500">MedAI Beta — Strengths & Weaknesses</div>
          </div>
          {data && (
            <button
              onClick={() => setData(null)}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded"
            >
              Change key
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!data ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-sm mx-auto">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Doctor Analytics</h2>
            <p className="text-xs text-gray-500 text-center mb-5">Enter your doctor key to view usage data and platform insights.</p>
            <form onSubmit={handleFetch} className="space-y-3">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Doctor key"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition"
              >
                {loading ? 'Loading…' : 'View Analytics'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Sessions" value={data.summary.total} />
              <StatCard label="Completed" value={data.summary.completed} color="text-green-600" />
              <StatCard label="Completion Rate" value={`${data.summary.completionRate}%`} color={data.summary.completionRate >= 70 ? 'text-green-600' : 'text-amber-600'} />
              <StatCard label="Avg Exchanges" value={data.summary.avgExchanges} sub="per completed session" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Active Now" value={data.summary.active} color="text-blue-600" />
              <StatCard label="Today" value={data.summary.today} />
              <StatCard label="This Week" value={data.summary.thisWeek} />
            </div>

            {/* AI History Quality */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">AI History Quality</h3>
              <p className="text-xs text-gray-500 mb-4">Exchange counts per completed session — lower is less patient fatigue, higher is more thorough.</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xl font-bold text-blue-600">{data.aiHistoryQuality.avgExchanges}</div>
                  <div className="text-xs text-gray-500">Average exchanges</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-700">{data.aiHistoryQuality.medianExchanges}</div>
                  <div className="text-xs text-gray-500">Median exchanges</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(data.aiHistoryQuality.exchangeDistribution).map(([range, count]) => (
                  <MiniBar key={range} label={range} value={count} max={maxDist} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${data.aiHistoryQuality.completionRate >= 70 ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-gray-600">{data.aiHistoryQuality.completionRate}% of started sessions reach completion</span>
                </div>
              </div>
            </div>

            {/* Consultation Funnel */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Consultation Funnel</h3>
              <p className="text-xs text-gray-500 mb-4">Where sessions currently sit in the workflow.</p>
              <div className="space-y-2">
                {[
                  { key: 'TAKING_HISTORY', label: 'Taking history', color: 'bg-blue-400' },
                  { key: 'AWAITING_DOCTOR', label: 'Awaiting doctor review', color: 'bg-amber-400' },
                  { key: 'IN_REVIEW', label: 'In review', color: 'bg-purple-400' },
                  { key: 'SIGNED', label: 'Signed off', color: 'bg-green-500' },
                  { key: 'abandoned', label: 'Abandoned (no messages)', color: 'bg-gray-300' },
                ].map(({ key: k, label, color }) => {
                  const count = data.consultationFunnel[k as keyof typeof data.consultationFunnel];
                  const pct = totalFunnel > 0 ? Math.round((count / totalFunnel) * 100) : 0;
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <div className="w-36 text-xs text-gray-600 flex-shrink-0">{label}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-xs font-semibold text-gray-700">{count}</span>
                        <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">User & Growth Metrics</h3>
              <p className="text-xs text-gray-500 mb-4">Sessions per day over the last 7 days.</p>
              <div className="flex items-end justify-around gap-2">
                {data.userGrowth.dailySessions.map((d) => (
                  <DayBar key={d.date} date={d.date} count={d.count} max={maxDay} />
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-50">
                <div>
                  <div className="text-lg font-bold text-gray-900">{data.userGrowth.totalSessions}</div>
                  <div className="text-xs text-gray-500">Total sessions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{data.userGrowth.uniqueKeys}</div>
                  <div className="text-xs text-gray-500">Unique access keys</div>
                </div>
              </div>
            </div>

            {/* Errors & Reliability */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Errors & Reliability</h3>
              <p className="text-xs text-gray-500 mb-4">
                {data.errors.total === 0
                  ? 'No errors recorded — system is running cleanly.'
                  : `${data.errors.total} error${data.errors.total === 1 ? '' : 's'} recorded since last restart.`}
              </p>
              {data.errors.recent.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-3 py-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">All systems healthy</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.errors.recent.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 bg-red-50 rounded-xl px-3 py-2">
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-red-700">{err.type}</div>
                        <div className="text-xs text-red-500 truncate">{err.message}</div>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">{formatTime(err.at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 pb-4">
              Data reflects live in-memory sessions · Resets on server restart
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
