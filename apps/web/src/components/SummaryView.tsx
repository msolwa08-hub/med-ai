import { useState, useEffect } from 'react';
import { api } from '../api';

interface Props {
  sessionId: string;
  summary: string | null;
  onBack: () => void;
  onReset: () => void;
}

function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic / em
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // HR
    .replace(/^---$/gm, '<hr/>')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Bullet lists
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs (double newline → p)
    .split(/\n\n+/)
    .map((block) => {
      if (/^<(h[23]|ul|ol|hr|li)/.test(block.trim())) return block;
      if (block.trim()) return `<p>${block.trim()}</p>`;
      return '';
    })
    .join('\n');
}

export function SummaryView({ sessionId, summary: propSummary, onBack, onReset }: Props) {
  const [summary, setSummary] = useState<string | null>(propSummary);
  const [loading, setLoading] = useState(!propSummary);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (propSummary) {
      setSummary(propSummary);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.getSummary(sessionId)
      .then((res) => setSummary(res.summary))
      .catch(() => setSummary('Failed to load clinical summary. Please go back and try again.'))
      .finally(() => setLoading(false));
  }, [sessionId, propSummary]);

  async function handleCopy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to chat
            </button>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
            <button
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              New session
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">For clinical use only</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This summary is generated by AI and must be reviewed and approved by Dr. Patel before acting on any recommendations. Not shown to the patient.
            </p>
          </div>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-white text-lg font-bold">GP Clinical Summary</h1>
            <p className="text-blue-200 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Generating clinical summary...</p>
                <p className="text-xs text-gray-400 mt-1">This takes about 10–15 seconds</p>
              </div>
            )}

            {!loading && summary && (
              <div
                className="summary-content prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
              />
            )}

            {!loading && !summary && (
              <p className="text-sm text-gray-500 text-center py-8">No summary available.</p>
            )}
          </div>
        </div>

        {/* Action row */}
        {!loading && summary && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {copied ? 'Copied!' : 'Copy summary'}
            </button>
            <button
              onClick={onReset}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Start new history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
