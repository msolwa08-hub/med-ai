import { useState } from 'react';
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
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏷️</p>
        <p>Specialist tab is currently available for O&G.</p>
        <p className="text-sm mt-1">More specialties coming soon.</p>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {m === 'obs' ? '🤱 Obstetrics' : '⚕️ Gynaecology'}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <AiBtn onClick={generate} loading={loading} label={`Generate ${mode === 'obs' ? 'Obs' : 'Gynae'} Note`} />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {result && <DocOutput text={result} />}
    </div>
  );
}
