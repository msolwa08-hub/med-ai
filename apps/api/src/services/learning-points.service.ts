import { anthropic, CLAUDE_SONNET_MODEL, logUsage } from '../lib/claude.js';

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

export interface Part1PrepPoint {
  question: string;
  answer: string;
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
  // Part 1 exam prep fields — all optional
  part1PharmacologyPearls?: string[];
  part1ExamTraps?: string[];
  part1MustKnow?: Part1PrepPoint[];
  part1ClassicScenario?: string;
  generatedAt: string;
}

// ============================================================
// System prompt
// ============================================================

const SYSTEM_PROMPT = `You are a dual-role clinical educator for South African doctors:
1. Ward mentor for interns (practical, SA-relevant clinical content)
2. Part 1 exam coach targeting FCP(SA), FC Paeds(SA), FC Psych(SA), FCFP(SA), and MMed candidates

Generate concise, high-yield content about the given condition. Be memorable, practical, and SA-relevant.

Return ONLY valid JSON matching this exact schema (no markdown fences, no extra text):
{
  "pathophysiology": "2-3 sentence clear mechanistic explanation",
  "classicPresentation": "The typical patient scenario in SA context",
  "keyExamFindings": ["finding 1", "finding 2", "..."],
  "clinicalPearls": ["pearl 1", "pearl 2", "pearl 3"],
  "complications": ["complication 1", "..."],
  "differentialTips": "1-2 sentences on how to distinguish from common mimics",
  "memorableMnemonic": "optional helpful mnemonic or null",
  "saContext": "What makes this condition special in the SA context — prevalence, HIV co-infection, formulary, etc.",
  "part1PharmacologyPearls": [
    "Drug name: mechanism of action, key side effects, contraindications, and Part 1 exam relevance"
  ],
  "part1ExamTraps": [
    "Common candidate mistake or trick question on this topic"
  ],
  "part1MustKnow": [
    { "question": "Exam-style question", "answer": "Concise model answer" }
  ],
  "part1ClassicScenario": "A realistic clinical vignette followed by model answer"
}

The part1* fields are OPTIONAL. Include them only when the condition has meaningful pharmacology or exam relevance. Omit them (or set to empty array / null) for very simple conditions.
For part1PharmacologyPearls: include mechanism, major side effects, contraindications (3-5 drugs).
For part1ExamTraps: classic candidate mistakes, trick questions, easily confused facts (3-5 items).
For part1MustKnow: 4-6 high-yield Q&A pairs in Part 1 exam style.
For part1ClassicScenario: realistic SA patient vignette + model answer a Part 1 examiner expects.`;

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
    model: CLAUDE_SONNET_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  logUsage('learning-points', CLAUDE_SONNET_MODEL, response.usage);

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from AI model');
  }

  // Strip markdown code fences if present
  const raw = content.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let parsed: Omit<LearningPoints, 'generatedAt'>;
  try {
    parsed = JSON.parse(raw) as Omit<LearningPoints, 'generatedAt'>;
  } catch {
    throw new Error('AI returned invalid JSON for learning points');
  }

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
  };
}
