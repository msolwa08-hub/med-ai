import { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { DOC_SPECS, generateDoc, type DocType } from '../lib/docGen';
import { DocOutput, Spinner } from './ui';

// ─── QUICKDOCS — every chart document, one tap from the bedside ──────────────
// The output side of the loop: the record is full, now get it on paper. Pick a
// document, it generates from the current record + working diagnosis, and drops
// out as plain text ready to copy or transcribe. Lives in a drawer so it never
// competes with the capture canvas. Generated docs are cached per type for the
// session so re-opening is instant.

export function QuickDocs({ patient, toolsKey, dept }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
}) {
  const [cache, setCache] = useState<Partial<Record<DocType, string>>>(
    patient.admissionNote ? { admission: patient.admissionNote } : {}
  );
  const [active, setActive] = useState<DocType | null>(null);
  const [loading, setLoading] = useState<DocType | null>(null);
  const [error, setError] = useState('');

  async function open(type: DocType) {
    setError('');
    if (cache[type]) { setActive(type); return; }
    setLoading(type);
    try {
      const text = await generateDoc(toolsKey, type, patient, dept);
      setCache(prev => ({ ...prev, [type]: text }));
      setActive(type);
    } catch {
      setError('Could not generate that document — check the record has the basics, then retry.');
    } finally {
      setLoading(null);
    }
  }

  if (active && cache[active]) {
    const spec = DOC_SPECS.find(d => d.id === active)!;
    return (
      <div className="space-y-3">
        <button
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All documents
        </button>
        <div>
          <h4 className="text-base font-semibold text-ink tracking-tight">{spec.label}</h4>
          <button
            onClick={() => { setCache(prev => ({ ...prev, [active]: undefined })); open(active); }}
            className="text-xs text-brand-700 hover:text-brand-800"
          >
            Regenerate
          </button>
        </div>
        <DocOutput text={cache[active]!} />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-ink-soft">
        Generated from the current record and working diagnosis — pick one, then copy or transcribe onto the chart.
      </p>
      {error && <p className="text-sm text-band-exclude">{error}</p>}
      <div className="space-y-2">
        {DOC_SPECS.map(spec => (
          <button
            key={spec.id}
            onClick={() => open(spec.id)}
            disabled={loading !== null}
            className="w-full flex items-center gap-3 text-left rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand-200 hover:bg-brand-50/40 disabled:opacity-50 transition-colors focus:outline-none focus-visible:shadow-focus"
          >
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-surface-alt text-ink-soft shrink-0">
              {loading === spec.id ? <Spinner className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-ink">{spec.label}</span>
              <span className="block text-xs text-ink-mute truncate">{cache[spec.id] ? 'Ready — tap to view' : spec.blurb}</span>
            </span>
            {cache[spec.id] && <span className="text-2xs font-medium text-brand-700 shrink-0">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
