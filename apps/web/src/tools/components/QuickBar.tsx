import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Check, AlertTriangle, CornerDownLeft, Loader2, Camera } from 'lucide-react';
import { toolsApi, type AssistField, type ScanFieldResult } from '../toolsApi';
import { downscaleImage } from '../lib/image';

// ─── THE CHATBOX — the one input surface (M-GLANCE Glance 2) ─────────────────
// The encounter happened on paper; this is where its content lands. One box:
// TYPE or DICTATE terse fragments ("BP 145/92, tachy, creps L base") or
// PHOTOGRAPH the handwritten note — everything routes itself into the right
// record slots and the working picture refreshes. The user never hunts for a
// field, ticks a box, or fills a form on this path.

// Minimal typing for the Web Speech API (not in lib.dom for the webkit prefix).
type SpeechRec = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
};
function getRecognition(): SpeechRec | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true; r.interimResults = true; r.lang = 'en-ZA';
  return r;
}

const CONF_TONE: Record<ScanFieldResult['confidence'], string> = {
  high: 'bg-brand-50 text-brand-700 border-brand-200',
  medium: 'bg-warn/[0.10] text-warn border-warn/25',
  low: 'bg-danger/[0.10] text-danger border-danger/25',
};

export function QuickBar({
  toolsKey, dept, subDept, fields, context, onResults,
  section = 'Clerking', title = 'Quick clerk', hint = "say or paste it all; I'll file it", cta = 'Fill record',
  placeholder = 'e.g. "54 year old man, crushing central chest pain 2 hours, sweaty, known hypertensive and diabetic, BP 148 over 92, HR 96, sats 96 on air, chest clear"',
}: {
  toolsKey: string;
  dept: string;
  subDept?: string;
  fields: AssistField[];
  context: string;
  /** Parsed values routed back to the record; label lets the parent flash what filled. */
  onResults: (updates: Record<string, string>) => void;
  /** Parse section (labels the endpoint's task frame). */
  section?: string;
  title?: string;
  hint?: string;
  cta?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [filled, setFilled] = useState<{ label: string; confidence: ScanFieldResult['confidence']; note?: string }[]>([]);
  const [overall, setOverall] = useState('');
  const recRef = useRef<SpeechRec | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const baseRef = useRef(''); // text committed before dictation started
  const supported = useRef(typeof window !== 'undefined' && !!getRecognition());
  const labelFor = (k: string) => fields.find(f => f.key === k)?.label ?? k;

  useEffect(() => () => { recRef.current?.stop(); }, []);

  function toggleMic() {
    if (listening) { recRef.current?.stop(); return; }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    baseRef.current = text ? `${text} ` : '';
    rec.onresult = e => {
      let out = '';
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      setText(baseRef.current + out);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }

  async function parse() {
    const dump = text.trim();
    if (!dump || loading) return;
    if (listening) { recRef.current?.stop(); setListening(false); }
    setLoading(true); setError(''); setFilled([]); setOverall('');
    try {
      const res = await toolsApi.quickParse(toolsKey, { dept, subDept, section, fields, text: dump, context });
      const updates: Record<string, string> = {};
      const flash: typeof filled = [];
      for (const [k, v] of Object.entries(res.results)) {
        updates[k] = v.value;
        flash.push({ label: labelFor(k), confidence: v.confidence, note: v.note });
      }
      if (Object.keys(updates).length === 0) {
        setError('Couldn’t make out anything clinical in that — try saying it another way.');
      } else {
        onResults(updates);
        setFilled(flash);
        setOverall(res.overallNote);
        setText('');
      }
    } catch {
      setError('Quick fill is unavailable right now — dictate/type into the guided clerking below instead.');
    } finally {
      setLoading(false);
    }
  }

  // Photograph the handwritten note — the same routing, per-field confidence
  // flagged so the user knows exactly which readings to double-check.
  async function scanPhoto(file: File) {
    if (scanning || loading) return;
    setScanning(true); setError(''); setFilled([]); setOverall('');
    try {
      const { base64, mediaType } = await downscaleImage(file);
      const res = await toolsApi.scanNotes(toolsKey, { dept, subDept, section, fields, imageBase64: base64, mediaType, context });
      const updates: Record<string, string> = {};
      const flash: typeof filled = [];
      for (const [k, v] of Object.entries(res.results)) {
        updates[k] = v.value;
        flash.push({ label: labelFor(k), confidence: v.confidence, note: v.note });
      }
      if (Object.keys(updates).length === 0) {
        setError('Nothing readable on that photo — try better lighting, or type the fragments.');
      } else {
        onResults(updates);
        setFilled(flash);
        const unread = res.unreadable?.map(k => labelFor(k)) ?? [];
        setOverall([res.overallNote, unread.length ? `Unreadable: ${unread.join(', ')}.` : ''].filter(Boolean).join(' '));
      }
    } catch {
      setError('Could not scan the photo — try again with better lighting, or type the fragments.');
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="rounded-card border border-brand-200 bg-surface-brand p-4 sm:p-5 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-brand-600" />
        <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
        <span className="text-xs text-ink-soft">— {hint}</span>
      </div>

      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') parse(); }}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-surface border border-line-strong rounded-xl px-3.5 py-2.5 pr-12 text-base text-ink placeholder:text-ink-mute resize-none transition-shadow focus:outline-none focus:border-brand-500 focus:shadow-focus"
        />
        {supported.current && (
          <button
            onClick={toggleMic}
            aria-label={listening ? 'Stop dictation' : 'Dictate'}
            title={listening ? 'Stop dictation' : 'Dictate'}
            className={`absolute top-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-lg transition-colors focus:outline-none focus-visible:shadow-focus ${
              listening ? 'bg-danger text-white animate-pulse' : 'bg-surface-alt text-ink-soft hover:text-brand-700'
            }`}
          >
            {listening ? <MicOff className="w-[18px] h-[18px]" /> : <Mic className="w-[18px] h-[18px]" />}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={parse}
          disabled={loading || scanning || !text.trim()}
          className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-600 active:bg-brand-800 disabled:opacity-45 disabled:pointer-events-none text-white text-sm font-medium px-4 min-h-[42px] rounded-xl transition-colors focus:outline-none focus-visible:shadow-focus"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Filing…' : cta}
        </button>
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
          disabled={loading || scanning}
          aria-label="Photograph the paper notes"
          className="inline-flex items-center gap-2 border border-brand-300 bg-surface text-brand-800 hover:bg-brand-50 disabled:opacity-45 disabled:pointer-events-none text-sm font-medium px-3.5 min-h-[42px] rounded-xl transition-colors focus:outline-none focus-visible:shadow-focus"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {scanning ? 'Reading…' : 'Photo'}
        </button>
        <span className="text-2xs text-ink-mute hidden sm:inline-flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3" /> ⌘/Ctrl+Enter
        </span>
        {listening && <span className="text-2xs text-danger font-medium">● listening…</span>}
      </div>

      {error && <p className="mt-2 text-sm text-band-exclude">{error}</p>}

      <AnimatePresence>
        {filled.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 space-y-2"
          >
            <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-brand-700">
              <Check className="w-3.5 h-3.5" /> Filed {filled.length} field{filled.length > 1 ? 's' : ''} — verify the flagged ones
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filled.map((f, i) => (
                <span
                  key={i}
                  title={f.note}
                  className={`inline-flex items-center gap-1 text-2xs font-medium rounded-pill border px-2 py-1 ${CONF_TONE[f.confidence]}`}
                >
                  {f.confidence !== 'high' && <AlertTriangle className="w-3 h-3" />}
                  {f.label}
                </span>
              ))}
            </div>
            {overall && <p className="text-xs text-ink-mute italic leading-snug">{overall}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
