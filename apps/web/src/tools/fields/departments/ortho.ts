import type { DeptFieldFragments } from '../types';
import { surgicalHistoryFields } from './surgery';

export const orthoFields: DeptFieldFragments = {
  intake: d => [
    { key: 'procedure', label: 'Injury / Procedure', value: d.procedure ?? '', placeholder: 'Fracture / joint / procedure' },
    { key: 'popDay', label: 'Post-op Day', value: d.popDay ?? '', placeholder: 'Day post-op (if applicable)' },
    { key: 'immobilisation', label: 'Immobilisation', value: d.immobilisation ?? '', placeholder: 'POP, backslab, brace, etc.' },
    { key: 'dvtProphylaxis', label: 'DVT Prophylaxis', value: d.dvtProphylaxis ?? '', placeholder: 'LMWH / TED stockings / etc.' },
  ],

  // Same pre-theatre questions as general surgery.
  history: surgicalHistoryFields,

  assessment: {
    // After General + Focused exam (index 4), before Investigations.
    insertAt: 4,
    fields: d => [
      { key: 'neurovascular', label: 'Neurovascular Status', value: d.neurovascular ?? '', hint: 'distal pulses, sensation, motor, capillary refill', placeholder: 'Pulses / sensation / motor / cap refill distal to injury' },
    ],
  },
};
