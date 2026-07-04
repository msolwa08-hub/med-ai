import { useEffect, useRef, useState } from 'react';
import { toolsApi, type AssistField, type AssistTurn } from './toolsApi';

// Conversational AI-assisted logging: the AI asks one question at a time,
// the intern answers in freeform, and the structured form fills itself.
export function AssistPanel({ toolsKey, dept, section, fields, onUpdates }: {
  toolsKey: string;
  dept: string;
  section: string;
  fields: AssistField[];
  onUpdates: (updates: Record<string, string>) => void;
}) {
  const [transcript, setTranscript] = useState<AssistTurn[]>([]);
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  // fields is rebuilt by the parent every render; keep a live ref so the
  // effect below only fires once per section without stale values.
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  async function step(nextTranscript: AssistTurn[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await toolsApi.assist(toolsKey, {
        dept,
        section,
        fields: fieldsRef.current,
        transcript: nextTranscript,
      });
      if (Object.keys(res.updates).length > 0) {
        onUpdates(res.updates);
        const labels = fieldsRef.current
          .filter(f => f.key in res.updates)
          .map(f => f.label);
        setCaptured(prev => [...prev, ...labels.filter(l => !prev.includes(l))]);
      }
      setTranscript([...nextTranscript, { role: 'assistant', content: res.nextQuestion }]);
      setQuestion(res.nextQuestion);
      setDone(res.done);
      if (!res.done) setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setError('AI assist is unavailable right now — you can fill the form below directly.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void step([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit() {
    const text = answer.trim();
    if (!text || loading || done) return;
    setAnswer('');
    void step([...transcript, { role: 'user', content: text }]);
  }

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
          <span aria-hidden>✨</span> AI-assisted logging — {section}
        </h3>
        {captured.length > 0 && (
          <span className="text-[11px] text-teal-600">{captured.length} field{captured.length === 1 ? '' : 's'} captured</span>
        )}
      </div>

      {error ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>
      ) : (
        <div className={`text-sm leading-relaxed rounded-lg px-4 py-3 border ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-teal-100 text-gray-800'}`}>
          {loading && !question ? (
            <span className="text-gray-400">Preparing first question…</span>
          ) : (
            <>{done ? '✓ ' : ''}{question}</>
          )}
        </div>
      )}

      {!done && !error && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            disabled={loading}
            placeholder={loading ? 'Thinking…' : 'Answer in your own words — the form fills itself'}
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={loading || !answer.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
      )}

      {captured.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {captured.map(label => (
            <span key={label} className="text-[11px] bg-white text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
              ✓ {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
