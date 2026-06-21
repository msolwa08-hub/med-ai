import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';

// ============================================================
// Types
// ============================================================

export interface LearningPointsInput {
  conditionName: string;
  icd10Code: string;
  category: string;
  firstLineTreatment: unknown[];
  investigations: unknown[];
  redFlags?: string;
}

export interface LearningPoints {
  pathophysiology: string;
  classicPresentation: string;
  keyExamFindings: string[];
  clinicalPearls: string[];
  complications: string[];
  differentialTips: string;
  memorableMnemonic?: string;
  saContext: string;
  generatedAt: string;
}

// ============================================================
// System prompt
// ============================================================

const SYSTEM_PROMPT = `You are a clinical educator specialising in South African internal medicine and primary care.
Your audience is medical interns and junior doctors (MBChB graduates in their intern year).

Generate concise, high-yield learning content about the given condition. Be memorable, practical, and SA-relevant.
Focus on what the intern needs to know for the wards and primary care — not exam theory.

Return ONLY valid JSON matching this exact schema:
{
  "pathophysiology": "2-3 sentence clear mechanistic explanation",
  "classicPresentation": "The typical patient scenario in SA context",
  "keyExamFindings": ["finding 1", "finding 2", ...],
  "clinicalPearls": ["pearl 1", "pearl 2", "pearl 3"],
  "complications": ["complication 1", ...],
  "differentialTips": "1-2 sentences on how to distinguish from common mimics",
  "memorableMnemonic": "optional helpful mnemonic or null",
  "saContext": "What makes this condition special in the SA context — prevalence, HIV co-infection, formulary, etc."
}`;

// ============================================================
// Service function
// ============================================================

export async function generateLearningPoints(
  input: LearningPointsInput
): Promise<LearningPoints> {
  const userMessage = `Generate clinical learning points for the following condition:

Condition: ${input.conditionName}
ICD-10 Code: ${input.icd10Code}
Category: ${input.category}
${input.redFlags ? `Red Flags: ${input.redFlags}` : ''}

First-line Treatment:
${JSON.stringify(input.firstLineTreatment, null, 2)}

Investigations:
${JSON.stringify(input.investigations, null, 2)}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI model');
  }

  let parsed: Omit<LearningPoints, 'generatedAt'>;
  try {
    parsed = JSON.parse(content.text.trim()) as Omit<LearningPoints, 'generatedAt'>;
  } catch {
    throw new Error('AI returned invalid JSON for learning points');
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
