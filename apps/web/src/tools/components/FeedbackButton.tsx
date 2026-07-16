import { useState } from 'react';
import { MessageCircle, X, Check, ThumbsUp, ThumbsDown, Lightbulb, type LucideIcon } from 'lucide-react';
import { toolsApi } from '../toolsApi';
import { Card } from './ui';

const RATINGS: { key: 'good' | 'bad' | 'idea'; label: string; icon: LucideIcon }[] = [
  { key: 'good', label: 'Works', icon: ThumbsUp },
  { key: 'bad', label: 'Broke', icon: ThumbsDown },
  { key: 'idea', label: 'Idea', icon: Lightbulb },
];

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
  const [sent, setSent] = useState<'ok' | 'err' | false>(false);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!note.trim()) return;
    setSending(true);
    try {
      await toolsApi.sendFeedback(toolsKey, { screen, dept, subDept, rating, note: note.trim() });
      setSent('ok');
      setNote('');
      setTimeout(() => { setSent(false); setOpen(false); }, 1400);
    } catch {
      setSent('err');
      setTimeout(() => setSent(false), 2500);
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
          className="fixed bottom-4 right-4 z-40 h-11 rounded-full bg-ink/90 hover:bg-ink text-canvas text-sm font-medium px-4 shadow-e3 backdrop-blur flex items-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" aria-hidden /> Feedback
        </button>
      )}
      {open && (
        <Card elevation="hero" className="fixed bottom-4 right-4 z-40 w-[min(92vw,340px)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Quick feedback</span>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-mute hover:text-ink-soft p-0.5">
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
          {sent ? (
            <p className={`flex items-center justify-center gap-1.5 text-sm py-3 ${sent === 'ok' ? 'text-positive' : 'text-warn'}`}>
              {sent === 'ok'
                ? <><Check className="w-4 h-4" aria-hidden /> Thanks — logged.</>
                : 'Could not send — try again later.'}
            </p>
          ) : (
            <>
              <div className="flex gap-1.5">
                {RATINGS.map(({ key: r, label, icon: Icon }) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 text-sm rounded-lg py-1.5 border transition-colors ${
                      rating === r ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-ink-soft hover:border-brand-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden /> {label}
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
        </Card>
      )}
    </>
  );
}
