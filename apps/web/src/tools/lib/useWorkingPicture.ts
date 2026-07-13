import { useEffect, useRef, useState } from 'react';
import { toolsApi, type WorkingPicture } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { serializeLatestResults } from './investigations';

/**
 * Drives the bedside loop from any tab. Builds the working-picture request from
 * the patient's current record, passes the PREVIOUS picture so the engine
 * narrates the shift, and persists the result back onto the patient so Clerk and
 * Results share one live picture.
 *
 * Auto-fire: pass `autoSignature` — a string that changes whenever the record
 * changes (e.g. JSON of the fields that feed the picture) — and the hook will
 * debounce ~700ms and call `generate()` on its own, as long as there's a seed
 * (ANY clinical content — complaint, HPI, vitals or exam) and nothing is
 * already in flight. The effect
 * depends ONLY on the signature (and the seed's presence), so it fires exactly
 * once per real change — never in a render loop. Omit `autoSignature` to keep
 * the hook fully manual (existing callers).
 */
export function useWorkingPicture(
  patient: Patient,
  toolsKey: string,
  dept: DeptId,
  subDept: string | undefined,
  onPatient: (patch: Partial<Patient>) => void,
  autoSignature?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Mirrors `loading` synchronously so the debounced auto-fire timer can check
  // "is a request already in flight" without depending on `loading` state
  // (which would re-trigger the effect and risk a loop).
  const inFlightRef = useRef(false);

  const strip = (o: Record<string, unknown>): Record<string, string | undefined> =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v : undefined]));

  async function generate() {
    inFlightRef.current = true;
    setLoading(true);
    setError('');
    try {
      const resultsText = serializeLatestResults(patient.investigations ?? []);
      const picture = await toolsApi.workingPicture(toolsKey, {
        dept,
        subDept,
        intake: strip(patient.intake),
        history: strip(patient.history),
        assessment: strip(patient.assessment),
        problems: patient.problems.map(p => [p.problem, p.workingDx].filter(Boolean).join(' — ')).filter(Boolean),
        resultsText: resultsText || undefined,
        previousPicture: patient.workingPicture ? { differentials: patient.workingPicture.differentials } : null,
      });
      onPatient({ workingPicture: picture });
    } catch {
      // Honest failure copy: the engine takes ANY record, however sparse —
      // never imply the user owes it more information.
      setError('Couldn’t reach the engine — it will retry as you go, or tap Refresh.');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  // ANY clinical content is a seed — a chief complaint, typed fragments that
  // landed in the HPI, vitals, or exam findings. The picture must build from
  // whatever exists; nothing is a prerequisite (M-GLANCE).
  const seed = [
    patient.history.chiefComplaint,
    patient.history.hpi,
    patient.assessment.vitals,
    patient.assessment.examination,
  ]
    .map(s => s?.trim() ?? '')
    .join('')
    .trim();

  useEffect(() => {
    if (autoSignature === undefined) return; // manual mode — no auto-fire
    if (!seed) return; // truly empty patient — nothing to read yet
    const t = setTimeout(() => {
      if (!inFlightRef.current) generate();
    }, 700);
    return () => clearTimeout(t);
    // Fire only on a real change of signature/seed — deliberately NOT
    // depending on `generate`/`loading` to avoid re-arming on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSignature, seed]);

  return { picture: patient.workingPicture, loading, error, generate };
}

export type { WorkingPicture };
