import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

const DEPT_LABELS: Record<string, string> = {
  medicine: 'General Medicine',
  surgery: 'Surgery',
  og: 'Obstetrics & Gynaecology',
  paeds: 'Paediatrics',
  icu: 'ICU / High Dependency',
  emergency: 'Emergency Medicine',
  psych: 'Psychiatry',
  ortho: 'Orthopaedics',
};

export interface AssistField {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface AssistTurn {
  role: 'assistant' | 'user';
  content: string;
}

export interface AssistRequest {
  dept: string;
  section: string; // e.g. "Intake", "History", "Assessment", "Ward Round"
  fields: AssistField[];
  transcript: AssistTurn[];
}

export interface AssistResponse {
  updates: Record<string, string>;
  nextQuestion: string;
  done: boolean;
}

function buildSystemPrompt(req: AssistRequest): string {
  const deptLabel = DEPT_LABELS[req.dept] ?? req.dept;
  const fieldList = req.fields
    .map(f => `- ${f.key}: ${f.label}${f.hint ? ` (${f.hint})` : ''} — ${f.value ? `already recorded: "${f.value}"` : 'MISSING'}`)
    .join('\n');

  return `You are MedAI Scribe, an AI assistant helping a busy hospital intern on a South African ${deptLabel} ward log the "${req.section}" section of a patient record — hands-busy, eyes-off-the-screen.

THE FIELDS TO CAPTURE:
${fieldList}

HOW YOU WORK (strict):
1. Ask EXACTLY ONE short, focused question at a time — the intern is busy; questions must be answerable in a few words spoken aloud.
2. From each answer, extract values for ANY fields it covers (interns often answer several at once, e.g. "34 year old male, bed 12" — capture all of it).
3. Never re-ask for a field that is already recorded, unless the intern corrects it.
4. If an answer is ambiguous or clinically incomplete, ask one brief clarifying question before moving on.
5. Prompt for anything the intern may have missed — your job is to make sure NO field is left blank unintentionally. If the intern says "skip" or "none", record "—" for that field and move on.
6. Use clinical shorthand the intern will recognise (NKDA, PMH, HPI, obs) but keep questions plain and quick.
7. When every field has a value (or was explicitly skipped), set "done": true and make "nextQuestion" a one-line confirmation summary instead of a question.

RESPONSE FORMAT — reply with ONLY a JSON object, no prose before or after:
{
  "updates": { "<fieldKey>": "<extracted value>", ... },
  "nextQuestion": "<your single next question, or the confirmation line when done>",
  "done": false
}

"updates" must contain only fields whose value you extracted or corrected from the intern's LAST message (empty object on the first turn). Normalise dates to YYYY-MM-DD and keep clinical values verbatim.`;
}

export class ToolsAssistEngine {
  async step(req: AssistRequest): Promise<AssistResponse> {
    const system = buildSystemPrompt(req);

    const messages: { role: 'user' | 'assistant'; content: string }[] =
      req.transcript.length === 0
        ? [{ role: 'user', content: 'Ready — ask me the first question.' }]
        : req.transcript.map(t => ({ role: t.role, content: t.content }));

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system,
      messages,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    const parsed = extractJSON<Partial<AssistResponse>>(text);
    if (!parsed || typeof parsed.nextQuestion !== 'string') {
      // Degrade gracefully: treat the whole reply as the next question.
      return { updates: {}, nextQuestion: text.trim() || 'Could you repeat that?', done: false };
    }

    const updates: Record<string, string> = {};
    const allowed = new Set(req.fields.map(f => f.key));
    for (const [k, v] of Object.entries(parsed.updates ?? {})) {
      if (allowed.has(k) && typeof v === 'string') updates[k] = v;
    }

    return {
      updates,
      nextQuestion: parsed.nextQuestion,
      done: parsed.done === true,
    };
  }
}

export const toolsAssist = new ToolsAssistEngine();
