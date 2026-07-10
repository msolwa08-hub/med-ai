import React from 'react';
import { ClipboardList } from 'lucide-react';

interface Session {
  id: string;
  status: string;
  department?: string;
  ageSex?: string;
  createdAt: string;
  messageCount: number;
  summary?: string;
}

interface Props {
  sessions: Session[];
  onSelect: (id: string) => void;
}

const DEPT_LABELS: Record<string, string> = {
  medicine: 'General Medicine', surgery: 'Surgery', og: 'O&G',
  paeds: 'Paeds', icu: 'ICU', emergency: 'Emergency', psych: 'Psych', ortho: 'Ortho',
};

export function SessionListView({ sessions, onSelect }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-ink-mute">
        <ClipboardList className="w-9 h-9 mx-auto mb-3" aria-hidden />
        <p className="font-medium">No sessions yet</p>
        <p className="text-sm mt-1">Patient histories will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className="w-full bg-surface border border-line hover:border-line-strong hover:shadow-card-hover rounded-card p-4 text-left transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  s.status === 'completed' ? 'bg-positive/10 text-positive' : 'bg-warn/10 text-warn'
                }`}>
                  {s.status}
                </span>
                {s.department && (
                  <span className="text-xs text-ink-mute">{DEPT_LABELS[s.department] ?? s.department}</span>
                )}
                {s.ageSex && <span className="text-xs text-ink-mute">{s.ageSex}</span>}
              </div>
              {s.summary && (
                <p className="text-sm text-ink-soft line-clamp-2 mt-1">{s.summary}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-ink-mute">{new Date(s.createdAt).toLocaleDateString()}</p>
              <p className="text-xs text-ink-mute">{s.messageCount} msgs</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
