import { useState } from 'react';
import { toolsApi } from '../toolsApi';

// ─── FEEDBACK BUTTON — the beta loop back from the ward ──────────────────────
// A floating tab in the corner. One tap opens a tiny form: good / bad / idea +
// a note. It stamps the current screen and department automatically so I know
// where the intern was when they hit something. Fire-and-forget; never blocks.

export function FeedbackButton({ toolsKey, screen, dept, subDept }: {
  toolsKey: string;
  screen: string;
  dept?: string;
  subDept?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<'good' | 'bad' | 'idea'>('idea');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!note.trim()) return;
    setSending(true);
    try {
      await toolsApi.sendFeedback(toolsKey, { screen, dept, subDept, rating, note: note.trim() });
      setSent(true);
      setNote('');
      setTimeout(() => { setSent(false); setOpen(false); }, 1400);
    } catch {
      // A dropped beta note is not worth an error dialog on a ward.
      setSent(true);
      setTimeout(() => { setSent(false); setOpen(false); }, 1400);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Send feedback"
          className="fixed bottom-20 right-4 lg:bottom-4 z-40 h-11 rounded-full bg-gray-900/90 hover:bg-gray-900 text-white text-sm font-medium px-4 shadow-lg backdrop-blur flex items-center gap-1.5"
        >
          💬 Feedback
        </button>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-40 w-[min(92vw,340px)] rounded-2xl bg-surface border border-line shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Quick feedback</span>
            <button onClick={() => setOpen(false)} className="text-ink-mute hover:text-ink-soft text-lg leading-none">×</button>
          </div>
          {sent ? (
            <p className="text-sm text-emerald-700 py-3 text-center">✓ Thanks — logged.</p>
          ) : (
            <>
              <div className="flex gap-1.5">
                {([['good', '👍 Works'], ['bad', '👎 Broke'], ['idea', '💡 Idea']] as const).map(([r, label]) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`flex-1 text-[13px] rounded-lg py-1.5 border transition-colors ${
                      rating === r ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                autoFocus
                placeholder={`What happened on "${screen}"? What did you expect?`}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
              <button
                onClick={send}
                disabled={!note.trim() || sending}
                className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-xl"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
