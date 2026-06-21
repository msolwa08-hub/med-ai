import { anthropic, CLAUDE_HAIKU_MODEL, logUsage } from '../lib/claude.js';
import { PII_TOKENS, restorePII } from '../lib/deidentify.js';

// ============================================================
// Types
// ============================================================

export interface SickNoteInput {
  patientName: string;
  patientIdNumber?: string;
  patientDateOfBirth?: string;
  patientOccupation?: string;
  doctorName: string;
  doctorHpcsa: string;
  practiceName: string;
  practiceAddress?: string;
  diagnosisText: string;       // shown on cert — can be general e.g. "Acute medical condition"
  icd10Code?: string;
  dateOfConsultation: string;  // YYYY-MM-DD
  unfitFromDate: string;       // YYYY-MM-DD
  unfitToDate: string;         // YYYY-MM-DD
  daysOff: number;
  fitnessStatement?: string;   // e.g. "Fit to return to light duties"
  additionalNotes?: string;
}

export interface SickNote {
  certificateText: string;
  generatedAt: string;
}

// ============================================================
// System prompt
// ============================================================

const SYSTEM_PROMPT = `You are a medical documentation assistant for South African healthcare.
Generate a formal Medical Certificate / Sick Note in standard South African format.

Requirements:
- Follows HPCSA professional guidelines for medical certificates
- Formal, legally-appropriate language
- Clear certification statement
- Specify exact dates and duration
- Include fitness for work assessment
- Concise (150–250 words) — sick notes must be clear and brief
Do NOT add a letterhead or signature lines — the practice will complete these.
Return ONLY the certificate text. No JSON, no preamble.`;

// ============================================================
// Service function
// ============================================================

export async function generateSickNote(input: SickNoteInput): Promise<SickNote> {
  const userMessage = `Generate a Medical Certificate / Sick Note with the following details:

Patient Name: ${PII_TOKENS.name}
${input.patientIdNumber ? `Patient ID Number: ${PII_TOKENS.idNumber}` : ''}
${input.patientDateOfBirth ? `Date of Birth: ${PII_TOKENS.dateOfBirth}` : ''}
${input.patientOccupation ? `Occupation: ${input.patientOccupation}` : ''}

Certifying Doctor: ${input.doctorName}
HPCSA Number: ${input.doctorHpcsa}
Practice Name: ${input.practiceName}
${input.practiceAddress ? `Practice Address: ${input.practiceAddress}` : ''}

Diagnosis: ${input.diagnosisText}
${input.icd10Code ? `ICD-10 Code: ${input.icd10Code}` : ''}

Date of Consultation: ${input.dateOfConsultation}
Unfit From: ${input.unfitFromDate}
Unfit Until: ${input.unfitToDate}
Total Days Off: ${input.daysOff} day${input.daysOff === 1 ? '' : 's'}

${input.fitnessStatement ? `Fitness Statement: ${input.fitnessStatement}` : ''}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ''}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  logUsage('sick-note', CLAUDE_HAIKU_MODEL, response.usage);

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI model');
  }

  // Re-attach the real identifiers locally — the model only saw placeholders.
  const certificateText = restorePII(content.text.trim(), {
    [PII_TOKENS.name]: input.patientName,
    [PII_TOKENS.idNumber]: input.patientIdNumber,
    [PII_TOKENS.dateOfBirth]: input.patientDateOfBirth,
  });

  return {
    certificateText,
    generatedAt: new Date().toISOString(),
  };
}
