export function formatDischargeSummary(d: {
  patientSummary: string;
  diagnosis: string;
  treatmentProvided: string;
  dischargeMedications: string[];
  followUpInstructions: string;
  warningSignsToReturn: string[];
  disclaimer: string;
}): string {
  return [
    'DISCHARGE SUMMARY',
    '=================',
    '',
    'PATIENT SUMMARY',
    d.patientSummary,
    '',
    'DIAGNOSIS',
    d.diagnosis,
    '',
    'TREATMENT PROVIDED',
    d.treatmentProvided,
    '',
    'DISCHARGE MEDICATIONS',
    ...d.dischargeMedications.map((m, i) => `${i + 1}. ${m}`),
    '',
    'FOLLOW-UP INSTRUCTIONS',
    d.followUpInstructions,
    '',
    'RETURN IF:',
    ...d.warningSignsToReturn.map(w => `• ${w}`),
    '',
    '---',
    d.disclaimer,
  ].join('\n');
}

export function formatRoundNote(n: { summary: string; disclaimer: string }): string {
  return `${n.summary}\n\n---\n${n.disclaimer}`;
}
