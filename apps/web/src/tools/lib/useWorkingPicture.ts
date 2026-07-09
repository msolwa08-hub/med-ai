import { useState } from 'react';
import { toolsApi, type WorkingPicture } from '../toolsApi';
import type { DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { serializeLatestResults } from './investigations';

/**
 * Drives the bedside loop from any tab. Builds the working-picture request from
 * the patient's current record, passes the PREVIOUS picture so the engine
 * narrates the shift, and persists the result back onto the patient so Clerk and
 * Results share one live picture.
 */
export function useWorkingPicture(
  patient: Patient,
  toolsKey: string,
  dept: DeptId,
  subDept: string | undefined,
  onPatient: (patch: Partial<Patient>) => void,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strip = (o: Record<string, unknown>): Record<string, string | undefined> =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v : undefined]));

  async function generate() {
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
      setError('Could not build the working picture — add a bit more to the record and try again.');
    } finally {
      setLoading(false);
    }
  }

  return { picture: patient.workingPicture, loading, error, generate };
}

export type { WorkingPicture };
