import { useEffect, useRef, useState } from 'react';
import { toolsApi, type AssistField, type AssistTurn, type ScanConfidence } from './toolsApi';

interface CapturedField {
  key: string;
  label: string;
  confidence: ScanConfidence | 'spoken';
  note?: string;
}

// Downscale a photo client-side so a 4 MB phone shot becomes a <1 MB JPEG
// before it is base64'd into the request body.
async function downscaleImage(file: File, maxDim = 1800): Promise<{ base64: string; mediaType: string }> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL('image/jpeg', 0.85);
  return { base64: out.split(',')[1], mediaType: 'image/jpeg' };
}

// Conversational AI-assisted logging: the AI asks one question at a time,
// the intern answers in freeform (or photographs the doctor's handwritten
// notes), and the structured form fills itself. Scanned values carry a
// per-field confidence; whatever the scan couldn't read, the conversation
// follows up on.
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
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [captured, setCaptured] = useState<CapturedField[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  // fields is rebuilt by the parent every render; keep a live ref so async
  // steps always see current values.
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  function markCaptured(keys: string[], confidence: CapturedField['confidence'], notes?: Record<string, string | undefined>) {
    setCaptured(prev => {
      const next = [...prev];
      for (const key of keys) {
        const label = fieldsRef.current.find(f => f.key === key)?.label ?? key;
        const existing = next.findIndex(c => c.key === key);
        const entry: CapturedField = { key, label, confidence, note: notes?.[key] };
        if (existing >= 0) next[existing] = entry;
        else next.push(entry);
      }
      return next;
    });
  }

  async function step(nextTranscript: AssistTurn[], fieldsOverride?: AssistField[]) {
    setLoading(true);
    setError(null);
    try {
      const res = await toolsApi.assist(toolsKey, {
        dept,
        section,
        fields: fieldsOverride ?? fieldsRef.current,
        transcript: nextTranscript,
      });
      if (Object.keys(res.updates).length > 0) {
        onUpdates(res.updates);
        markCaptured(Object.keys(res.updates), 'spoken');
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

  async function scanPhoto(file: File) {
    setScanning(true);
    setError(null);
    setScanNote(null);
    try {
      const { base64, mediaType } = await downscaleImage(file);
      const res = await toolsApi.scanNotes(toolsKey, {
        dept,
        section,
        fields: fieldsRef.current,
        imageBase64: base64,
        mediaType,
      });

      const updates: Record<string, string> = {};
      const notes: Record<string, string | undefined> = {};
      const byConfidence: Record<ScanConfidence, string[]> = { high: [], medium: [], low: [] };
      for (const [key, r] of Object.entries(res.results)) {
        updates[key] = r.value;
        notes[key] = r.note;
        byConfidence[r.confidence].push(key);
      }
      if (Object.keys(updates).length > 0) {
        onUpdates(updates);
        (['high', 'medium', 'low'] as const).forEach(c => markCaptured(byConfidence[c], c, notes));
      }
      if (res.overallNote) setScanNote(res.overallNote);

      // Hand the gaps back to the conversation: merged field values + a user
      // turn describing the scan, so the AI follows up on what's unclear.
      const merged = fieldsRef.current.map(f => (f.key in updates ? { ...f, value: updates[f.key] } : f));
      const verify = [...byConfidence.medium, ...byConfidence.low]
        .map(k => merged.find(f => f.key === k)?.label ?? k);
      const unread = res.unreadable.map(k => merged.find(f => f.key === k)?.label ?? k);
      const scanSummary =
        `I scanned the doctor's handwritten notes. ` +
        (Object.keys(updates).length ? `Captured: ${Object.keys(updates).length} fields. ` : 'Nothing could be captured. ') +
        (verify.length ? `Low-confidence (please ask me to verify): ${verify.join(', ')}. ` : '') +
        (unread.length ? `Unreadable (please ask me for these): ${unread.join(', ')}.` : '');
      setDone(false);
      await step([...transcript, { role: 'user', content: scanSummary }], merged);
    } catch {
      setError('Could not scan the photo — try again with better lighting, or answer by typing.');
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const busy = loading || scanning;
  const chipStyle: Record<CapturedField['confidence'], string> = {
    spoken: 'bg-teal-50 text-teal-700 border-teal-100',
    high: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-red-50 text-red-700 border-red-200',
  };
  const chipMark: Record<CapturedField['confidence'], string> = {
    spoken: '✓',
    high: '✓',
    medium: '~',
    low: '?',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm px-6 py-7 sm:px-8 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-[11px] font-semibold text-teal-600 uppercase tracking-[0.14em]">
          {section}
        </h3>
        <div className="flex items-center gap-3">
          {captured.length > 0 && (
            <span className="text-xs text-gray-400">{captured.length} captured</span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) void scanPhoto(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="text-[13px] bg-gray-50 hover:bg-teal-50 disabled:opacity-40 text-teal-700 px-3.5 py-1.5 rounded-full font-medium transition-colors"
            title="Photograph the doctor's handwritten notes — the AI reads them and fills the form, flagging anything it can't decipher"
          >
            {scanning ? 'Reading handwriting…' : '📷 Scan notes'}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">{error}</p>
      ) : (
        <p
          key={question || '__pending__'}
          className={`animate-question-in text-xl sm:text-2xl font-medium leading-snug tracking-tight ${done ? 'text-emerald-700' : 'text-gray-900'}`}
        >
          {busy && !question ? (
            <span className="text-gray-300">{scanning ? 'Reading the handwriting…' : 'One moment…'}</span>
          ) : (
            <>{done ? '✓ ' : ''}{question}</>
          )}
        </p>
      )}

      {scanNote && (
        <p className="text-[13px] text-gray-500 leading-relaxed">📷 {scanNote}</p>
      )}

      {!done && !error && (
        <div className="relative">
          <input
            ref={inputRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            disabled={busy}
            placeholder={busy ? 'Working…' : 'Just answer naturally'}
            className="w-full bg-gray-50 border border-transparent rounded-full pl-5 pr-14 py-3.5 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-60 transition-all"
          />
          <button
            onClick={submit}
            disabled={busy || !answer.trim()}
            aria-label="Send"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-teal-600 hover:bg-teal-500 disabled:opacity-30 text-white font-semibold transition-colors flex items-center justify-center"
          >
            {busy ? '…' : '↑'}
          </button>
        </div>
      )}

      {captured.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {captured.map(c => (
            <span
              key={c.key}
              title={c.note ?? (c.confidence === 'medium' ? 'Read from handwriting — verify' : c.confidence === 'low' ? 'Barely legible — check this' : undefined)}
              className={`animate-chip-in text-[11px] border rounded-full px-2.5 py-1 ${chipStyle[c.confidence]}`}
            >
              {chipMark[c.confidence]} {c.label}
              {c.confidence === 'medium' && ' — verify'}
              {c.confidence === 'low' && ' — check'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
