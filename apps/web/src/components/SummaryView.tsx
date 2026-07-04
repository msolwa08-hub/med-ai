import React from 'react';

interface Message {
  role: string;
  content: string;
  timestamp?: string;
}

interface Session {
  id: string;
  status: string;
  department?: string;
  ageSex?: string;
  summary?: string;
  complaints?: string[];
  history?: string;
  messages: Message[];
}

interface Props {
  session: Session;
  onBack: () => void;
}

export function SummaryView({ session, onBack }: Props) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1">
        ← Back to sessions
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            session.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {session.status}
          </span>
          <span className="text-gray-500 text-sm">{session.department ?? 'General'}</span>
          {session.ageSex && <span className="text-gray-400 text-sm">{session.ageSex}</span>}
        </div>

        {session.complaints && session.complaints.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chief Complaints</h3>
            <div className="flex flex-wrap gap-2">
              {session.complaints.map((c, i) => (
                <span key={i} className="bg-blue-50 text-teal-700 text-xs px-2 py-1 rounded-lg">{c}</span>
              ))}
            </div>
          </div>
        )}

        {session.summary && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AI Summary</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{session.summary}</p>
          </div>
        )}

        {session.history && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full History</h3>
            <pre className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3 overflow-auto max-h-64">
              {session.history}
            </pre>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Conversation ({session.messages.length} messages)
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
          {session.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user' ? 'bg-teal-50/60 text-blue-100' : 'bg-gray-100 text-gray-700'
              }`}>
                {m.content.replace(/```json[\s\S]*?```/g, '').trim()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
