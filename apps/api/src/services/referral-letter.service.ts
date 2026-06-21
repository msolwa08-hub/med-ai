import { anthropic, CLAUDE_HAIKU_MODEL, logUsage } from '../lib/claude.js';
import { PII_TOKENS, restorePII } from '../lib/deidentify.js';

// ============================================================
// Types
// ============================================================

export interface ReferralLetterInput {
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientIdNumber?: string;
  patientMedicalAid?: string;
  referringDoctorName: string;
  referringDoctorHpcsa: string;
  referringPracticeName: string;
  referringPracticeAddress?: string;
  referringPracticePhone?: string;
  specialty: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  clinicalSummary: string;
  diagnosis: string;
  icd10Code?: string;
  reasonForReferral: string;
  currentMedications?: string;
  relevantInvestigations?: string;
  additionalNotes?: string;
}

export interface ReferralLetter {
  letterText: string;
  generatedAt: string;
}

// ============================================================
// System prompt
// ============================================================

const SYSTEM_PROMPT = `You are a medical documentation assistant specialising in South African healthcare.
Generate a formal referral letter in the standard SA format used between GPs and specialists.

Requirements:
- Professional medical language appropriate for the receiving specialist
- Follow SA DOH referral conventions
- Include ICD-10 coding where provided
- 300–500 words, structured with: Date / Patient Details / Referring Doctor / Clinical Summary / Reason for Referral / Current Management / Specific Request
- Use SAGO / SASOG conventions for specialist letters where applicable
- Do NOT add a letterhead — the practice will print on their own letterhead
Return ONLY the formatted letter text. No JSON, no preamble.`;

// ============================================================
// Service function
// ============================================================

export async function generateReferralLetter(
  input: ReferralLetterInput
): Promise<ReferralLetter> {
  const userMessage = `Generate a referral letter with the following details:

Patient Name: ${PII_TOKENS.name}
Patient Age: ${input.patientAge}
Patient Gender: ${input.patientGender}
${input.patientIdNumber ? `Patient ID Number: ${PII_TOKENS.idNumber}` : ''}
${input.patientMedicalAid ? `Medical Aid: ${PII_TOKENS.medicalAid}` : ''}

Referring Doctor: ${input.referringDoctorName}
HPCSA Number: ${input.referringDoctorHpcsa}
Practice Name: ${input.referringPracticeName}
${input.referringPracticeAddress ? `Practice Address: ${input.referringPracticeAddress}` : ''}
${input.referringPracticePhone ? `Practice Phone: ${input.referringPracticePhone}` : ''}

Referral To: ${input.specialty} specialist
Urgency: ${input.urgency}

Diagnosis: ${input.diagnosis}
${input.icd10Code ? `ICD-10 Code: ${input.icd10Code}` : ''}

Clinical Summary:
${input.clinicalSummary}

Reason for Referral:
${input.reasonForReferral}

${input.currentMedications ? `Current Medications:\n${input.currentMedications}` : ''}
${input.relevantInvestigations ? `Relevant Investigations:\n${input.relevantInvestigations}` : ''}
${input.additionalNotes ? `Additional Notes:\n${input.additionalNotes}` : ''}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  logUsage('referral-letter', CLAUDE_HAIKU_MODEL, response.usage);

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI model');
  }

  // Re-attach the real identifiers locally — the model only saw placeholders.
  const letterText = restorePII(content.text.trim(), {
    [PII_TOKENS.name]: input.patientName,
    [PII_TOKENS.idNumber]: input.patientIdNumber,
    [PII_TOKENS.medicalAid]: input.patientMedicalAid,
  });

  return {
    letterText,
    generatedAt: new Date().toISOString(),
  };
}
