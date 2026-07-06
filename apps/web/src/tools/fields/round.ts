import type { AssistField } from '../toolsApi';
import type { RoundData } from './types';

export function roundAssistFields(d: RoundData): AssistField[] {
  return [
    { key: 'subjective', label: 'Subjective', value: d.subjective, kind: 'textarea', placeholder: 'How does the patient feel? Any new complaints?' },
    { key: 'plan', label: 'Plan for Today', value: d.plan, kind: 'textarea', placeholder: 'Active management for today' },
    { key: 'pending', label: 'Pending', value: d.pending, kind: 'textarea', placeholder: 'Awaiting results, consults, procedures' },
  ];
}
