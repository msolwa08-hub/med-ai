import type { DeptFieldFragments } from '../types';

export const psychFields: DeptFieldFragments = {
  history: {
    insertAt: 2,
    fields: d => [
      { key: 'psychHistory', label: 'Psychiatric History', value: d.psychHistory ?? '', kind: 'textarea', hint: 'previous episodes, admissions, suicide attempts, treatments', placeholder: 'Previous episodes, admissions, attempts, treatments' },
      { key: 'substanceUse', label: 'Substance Use', value: d.substanceUse ?? '', kind: 'textarea', hint: 'alcohol, cannabis, stimulants — amount, duration, last use', placeholder: 'Substances, amounts, duration, last use' },
      { key: 'collateral', label: 'Collateral History', value: d.collateral ?? '', kind: 'textarea', hint: 'from family/friends — note the source', placeholder: 'Collateral from family/carer (name the source)' },
    ],
  },

  assessment: {
    insertAt: 3,
    fields: d => [
      { key: 'mse', label: 'Mental State Exam', value: d.mse ?? '', kind: 'textarea', hint: 'appearance, behaviour, speech, mood/affect, thought, perception, cognition, insight', placeholder: 'MSE domains in order' },
      { key: 'riskAssessment', label: 'Risk Assessment', value: d.riskAssessment ?? '', kind: 'textarea', hint: 'suicide, harm to others, self-neglect — with protective factors', placeholder: 'Risk to self / others / self-neglect + protective factors' },
    ],
  },
};
