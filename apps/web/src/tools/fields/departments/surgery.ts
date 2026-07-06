import type { DeptFieldFragments, SplicedFields } from '../types';
import type { HistoryData } from '../types';

// Pre-theatre history questions shared by every surgical specialty —
// Orthopaedics reuses this same fragment.
export const surgicalHistoryFields: SplicedFields<HistoryData> = {
  insertAt: 5,
  fields: d => [
    { key: 'lastMeal', label: 'Last Oral Intake', value: d.lastMeal ?? '', hint: 'NPO status for theatre', placeholder: 'Time of last food/fluids' },
    { key: 'anaestheticHistory', label: 'Anaesthetic History', value: d.anaestheticHistory ?? '', hint: 'previous GA/spinal, complications, airway issues', placeholder: 'Previous GA/spinal, complications' },
  ],
};

export const surgeryFields: DeptFieldFragments = {
  history: surgicalHistoryFields,
};
