import { useState } from 'react';
import { Baby, Venus, Tag } from 'lucide-react';
import { toolsApi } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { AiBtn, DocOutput, SectionHead, copy } from '../components/ui';

// ─── SPECIALIST TAB (O&G) ─────────────────────────────────────────────────────

export function SpecialistTab({ patient, toolsKey, dept }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
}) {
  const [mode, setMode] = useState<'obs' | 'gynae'>('obs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');

  if (dept !== 'og') {
    return (
      <div className="text-center py-16 text-ink-mute">
        <Tag className="w-10 h-10 mx-auto mb-3" aria-hidden />
        <p>Specialist tab is currently available for O&G.</p>
        <p className="text-sm mt-1">Additional specialties will be available in future updates.</p>
      </div>
    );
  }

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const base = { ...patient.intake, ...patient.history, ...patient.assessment };
      let text = '';
      if (mode === 'obs') {
        const r = await toolsApi.obsNote(toolsKey, base);
        text = `OBSTETRIC NOTE\n==============\n\nGA: ${r.gestationalAge}\n\n${r.note}\n\nMATERNAL STATUS: ${r.maternalStatus}\nFETAL STATUS: ${r.fetalStatus}\n\nPLAN:\n${r.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      } else {
        const r = await toolsApi.gynaeNote(toolsKey, base);
        text = `GYNAECOLOGY NOTE\n================\n\n${r.note}\n\nWORKING DX: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nPLAN:\n${r.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      }
      setResult(text);
    } catch {
      setErr('Failed to generate note.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHead>O&G Specialist Notes</SectionHead>
      <div className="flex gap-2">
        {(['obs', 'gynae'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-brand-700 text-white shadow-card' : 'bg-surface border border-line-strong text-ink-soft hover:bg-surface-alt'
            }`}
          >
            {m === 'obs' ? <Baby className="w-4 h-4" aria-hidden /> : <Venus className="w-4 h-4" aria-hidden />}
            {m === 'obs' ? 'Obstetrics' : 'Gynaecology'}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <AiBtn onClick={generate} loading={loading} label={`Generate ${mode === 'obs' ? 'Obs' : 'Gynae'} Note`} />
      </div>
      {err && <p className="text-danger text-xs">{err}</p>}
      {result && <DocOutput text={result} />}
    </div>
  );
}
