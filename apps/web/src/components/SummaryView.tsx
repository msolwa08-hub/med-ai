import { useState } from 'react';
import type { StoredSession } from '../storage';

interface Props {
  session: StoredSession;
  onBack: () => void;
  onBackToList: () => void;
  onApprove: () => void;
  onSaveNotes: (notes: string) => void;
  onNewPatient: () => void;
}

type Tab = 'summary' | 'transcript';

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .split(/\n\n+/)
    .map((block) => {
      if (/^<(h[23]|ul|ol|hr|li)/.test(block.trim())) return block;
      if (block.trim()) return `<p>${block.trim()}</p>`;
      return '';
    })
    .join('\n');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

export function SummaryView({ session, onBack, onBackToList, onApprove, onSaveNotes, onNewPatient }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [notes, setNotes] = useState(session.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const summary = session.summary;
  const sessionDate = new Date(session.completedAt ?? session.createdAt).toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  async function handleCopy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  function handleSaveNotes() {
    onSaveNotes(notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-teal-50/30">
      {/* Header */}
      <header className="bg-white border-b border-teal-100 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-teal-600 transition p-1 -ml-1 rounded-xl"
            aria-label="Back to chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">{session.label}</div>
            <div className="text-xs text-teal-600">Clinical Summary</div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {summary && (
              <>
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-teal-100 hover:bg-teal-50 transition"
                >
                  {copied ? (
                    <span className="text-emerald-600">Copied!</span>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-teal-100 hover:bg-teal-50 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Print
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 flex gap-0 border-t border-teal-50">
          {(['summary', 'transcript'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === t
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'summary' ? 'Clinical Summary' : 'Transcript'}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Approval banner */}
        {!session.approved && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3 print:hidden">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Pending clinical review</p>
              <p className="text-xs text-amber-700 mt-0.5">AI-generated — must be reviewed by Dr. Patel before acting on any recommendations.</p>
            </div>
            <button
              onClick={onApprove}
              className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Approve
            </button>
          </div>
        )}

        {session.approved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 print:hidden">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-emerald-700 font-medium">Approved by Dr. Patel</p>
          </div>
        )}

        {/* Summary tab */}
        {tab === 'summary' && (
          <div className="print-area">
            {/* Print header */}
            <div className="hidden print:block mb-6">
              <h1 className="text-xl font-bold">GP Clinical Summary — MedAI</h1>
              <p className="text-sm text-slate-600">Sandton Family Practice · {sessionDate}</p>
              <p className="text-sm text-slate-600">Patient: {session.label}</p>
              <hr className="mt-3" />
            </div>

            <div className="bg-white rounded-3xl border border-teal-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 print:hidden"
                   style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
                <h1 className="text-white text-lg font-bold">GP Clinical Summary</h1>
                <p className="text-teal-100 text-sm mt-0.5">{sessionDate}</p>
              </div>

              <div className="p-6">
                {summary ? (
                  <div
                    className="summary-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
                  />
                ) : (
                  <p className="text-sm text-slate-400 text-center py-8">No summary available.</p>
                )}
              </div>
            </div>

            {/* Clinician notes */}
            <div className="mt-5 print:mt-6">
              <div className="bg-white rounded-2xl border border-teal-100 shadow-sm p-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Clinician notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your clinical notes here…"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-teal-100 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none print:hidden"
                />
                {notes && (
                  <div className="hidden print:block text-sm text-slate-800 whitespace-pre-wrap">{notes}</div>
                )}
                <div className="flex justify-end mt-2 print:hidden">
                  <button
                    onClick={handleSaveNotes}
                    className="text-xs px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl transition font-medium border border-teal-100"
                  >
                    {notesSaved ? 'Saved ✓' : 'Save notes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                onClick={onBackToList}
                className="flex-1 py-3 px-4 bg-white border border-teal-100 hover:bg-teal-50 text-slate-700 text-sm font-medium rounded-2xl transition"
              >
                Back to sessions
              </button>
              <button
                onClick={onNewPatient}
                className="flex-1 py-3 px-4 text-white text-sm font-semibold rounded-2xl transition shadow-sm"
                style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}
              >
                New patient
              </button>
            </div>
          </div>
        )}

        {/* Transcript tab */}
        {tab === 'transcript' && (
          <div>
            <div className="space-y-3">
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
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-patient'}>
                      {msg.content}
                    </div>
                    <span className={`text-xs text-slate-400 ${msg.role === 'patient' ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 print:hidden">
              <button
                onClick={onBackToList}
                className="w-full py-3 px-4 bg-white border border-teal-100 hover:bg-teal-50 text-slate-700 text-sm font-medium rounded-2xl transition"
              >
                Back to sessions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
