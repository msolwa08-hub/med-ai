import type { DeptFieldFragments } from '../types';

export const emergencyFields: DeptFieldFragments = {
  assessment: {
    insertAt: 1,
    fields: d => [
      { key: 'primarySurvey', label: 'Primary Survey', value: d.primarySurvey ?? '', kind: 'textarea', hint: 'ABCDE with interventions', placeholder: 'A: … B: … C: … D: … E: …' },
    ],
  },
};
