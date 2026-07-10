import { useRef, useState } from 'react';
import { toolsApi, type ImageAnalysisResult, type ImageModality } from '../toolsApi';
import { downscaleImage } from '../lib/image';
import { WhyButton } from './WhyButton';

// ─── Image capture node ──────────────────────────────────────────────────────
// Modality chip + one big camera/upload button → client-side downscale →
// toolsApi.analyzeImage → structured read-back (confidence chip, technical
// quality, findings, red flags, bold impression) with a primary "Insert into
// record" that serializes the injectText into the objective/exam field.

const MODALITIES: { id: ImageModality; label: string }[] = [
  { id: 'ecg', label: 'ECG' },
  { id: 'ctg', label: 'CTG' },
  { id: 'cxr', label: 'CXR' },
  { id: 'xray', label: 'X-ray' },
  { id: 'ultrasound', label: 'US' },
  { id: 'ct', label: 'CT' },
  { id: 'eeg', label: 'EEG' },
  { id: 'abg', label: 'ABG' },
  { id: 'wound', label: 'Wound' },
  { id: 'other', label: 'Other' },
];

const CONFIDENCE_STYLE: Record<ImageAnalysisResult['confidence'], string> = {
  high: 'bg-brand-50 text-brand-700 border-brand-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-red-50 text-red-700 border-red-200',
};

export function ImageCaptureNode({ toolsKey, dept, subDept, context, onInject }: {
  toolsKey: string;
  dept: string;
  subDept?: string;
  /** One-line patient context so the read is interpreted for THIS patient. */
  context?: string;
  onInject: (injectText: string, modality: ImageModality) => void;
}) {
  const [modality, setModality] = useState<ImageModality>('ecg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [inserted, setInserted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function analyze(file: File) {
    setLoading(true);
    setError('');
    setInserted(false);
    try {
      const { base64, mediaType } = await downscaleImage(file);
      const res = await toolsApi.analyzeImage(toolsKey, {
        dept,
        subDept,
        modality,
        imageBase64: base64,
        mediaType,
        context,
      });
      setResult(res);
    } catch {
      setResult(null);
      setError('Could not analyze the image — check lighting/focus and retake.');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function retake() {
    setResult(null);
    setError('');
    setInserted(false);
    fileRef.current?.click();
  }

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-sm p-5 space-y-4">
      <h3 className="text-xs font-semibold text-ink-mute uppercase tracking-wider">Image analysis</h3>

      <div className="flex flex-wrap gap-1.5">
        {MODALITIES.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModality(m.id)}
            className={`min-h-[44px] px-3.5 rounded-2xl text-sm border transition-colors ${
              modality === m.id
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-surface border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void analyze(f); }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="w-full min-h-[56px] rounded-2xl bg-surface-alt hover:bg-brand-50 border border-dashed border-line-strong hover:border-brand-400 text-ink-soft hover:text-brand-800 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Analyzing image…' : `📷 Photograph / upload ${MODALITIES.find(m => m.id === modality)?.label}`}
      </button>

      {error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={retake} className="text-brand-700 font-medium shrink-0 min-h-[44px] px-2">
            Retake
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] border rounded-full px-2.5 py-1 font-medium ${CONFIDENCE_STYLE[result.confidence]}`}>
              {result.confidence} confidence
            </span>
            {result.technicalQuality && (
              <span className="text-[11px] text-ink-mute">{result.technicalQuality}</span>
            )}
            <WhyButton why={result.disclaimer} />
          </div>

          {result.redFlags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
              {result.redFlags.map((r, i) => (
                <p key={i} className="text-[13px] text-red-800 font-medium">⛔ {r}</p>
              ))}
            </div>
          )}

          {result.findings.length > 0 && (
            <ul className="space-y-1">
              {result.findings.map((f, i) => (
                <li key={i} className="text-[13px] text-ink-soft flex gap-2">
                  <span className="text-brand-500 shrink-0">•</span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm font-semibold text-ink">{result.impression}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onInject(result.injectText, result.modality); setInserted(true); }}
              disabled={inserted}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-medium transition-colors ${
                inserted
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-brand-600 hover:bg-brand-500 text-white'
              }`}
            >
              {inserted ? '✓ Inserted into record' : 'Insert into record'}
            </button>
            <button
              type="button"
              onClick={retake}
              className="min-h-[44px] px-4 rounded-xl text-sm text-ink-mute hover:text-ink border border-line transition-colors"
            >
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
