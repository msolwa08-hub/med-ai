import type { StoredSession } from '../storage';

interface Props {
  sessions: StoredSession[];
  onNew: () => void;
  onOpen: (sessionId: string) => void;
  onSignOut: () => void;
  onRename: (sessionId: string, label: string) => void;
  onAnalytics: () => void;
  newSessionLoading?: boolean;
  newSessionError?: string;
  practiceName?: string;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export function SessionListView({ sessions, onNew, onOpen, onSignOut, onRename, onAnalytics, newSessionLoading, newSessionError, practiceName = 'MedAI' }: Props) {
  function handleRename(session: StoredSession) {
    const newLabel = window.prompt('Rename session:', session.label);
    if (newLabel && newLabel.trim() && newLabel.trim() !== session.label) {
      onRename(session.sessionId, newLabel.trim());
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                 style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">MedAI</div>
              <div className="text-xs text-gray-500">{practiceName}</div>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {newSessionError && (
          <div className="mb-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl border border-red-100">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {newSessionError}
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Patient Sessions</h2>
          <button
            onClick={onNew}
            disabled={newSessionLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:opacity-50 shadow-sm"
            style={{ background: newSessionLoading ? '#99f6e4' : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
          >
            {newSessionLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Starting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Patient
              </>
            )}
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-teal-50 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
              <svg className="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No sessions yet</p>
            <p className="text-xs text-slate-400 mb-5">Start a new session to begin taking a patient history.</p>
            <button
              onClick={onNew}
              disabled={newSessionLoading}
              className="px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
            >
              {newSessionLoading ? 'Starting…' : 'Start first session'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => onOpen(session.sessionId)}
                  className="w-full px-4 py-4 text-left hover:bg-gray-50 transition flex items-start gap-3"
                >
                  {/* Status dot */}
                  <div className="flex-shrink-0 mt-1">
                    {session.isComplete ? (
                      session.approved ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100">
                          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75m-7.5-9h15" />
                          </svg>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100">
                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{session.label}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(session.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${
                        session.isComplete
                          ? session.approved
                            ? 'text-green-600'
                            : 'text-amber-600'
                          : 'text-teal-600'
                      }`}>
                        {session.isComplete
                          ? session.approved
                            ? 'Approved'
                            : 'Pending review'
                          : 'In progress'}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{session.messages.length} messages</span>
                    </div>
                  </div>

                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                <div className="border-t border-gray-50 px-4 py-2 flex items-center justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRename(session); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition py-1 px-2 rounded"
                  >
                    Rename
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center pt-4 pb-2">
          <button
            onClick={onAnalytics}
            className="text-xs text-slate-400 hover:text-teal-600 transition underline underline-offset-2"
          >
            View Analytics
          </button>
          <span className="text-gray-200 mx-2">·</span>
          <span className="text-xs text-gray-300">MedAI Beta</span>
        </div>
      </div>
    </div>
  );
}
