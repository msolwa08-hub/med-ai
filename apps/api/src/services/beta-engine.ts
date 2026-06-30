import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { betaStore, type BetaMessage } from './beta-store.js';
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

function buildSystemPrompt(dept?: string, ageSex?: string, chiefComplaintHint?: string): string {
  const deptLabel = dept ? DEPT_LABELS[dept] ?? dept : 'General Medicine';
  const patientCtx = ageSex ? `Patient: ${ageSex}. ` : '';
  const hintCtx = chiefComplaintHint ? `Presenting with: ${chiefComplaintHint}. ` : '';

  return `You are MedAI, a focused AI history-taking assistant for a South African ${deptLabel} ward.
${patientCtx}${hintCtx}

YOUR ROLE:
- Take a thorough, focused history relevant to ${deptLabel}
- Ask one or two questions at a time — never overwhelm the patient
- Be warm, empathetic, and culturally sensitive
- Use simple language; avoid jargon unless necessary
- Cover: chief complaint, HPI (SOCRATES), PMH, medications, allergies, family history, social history, review of systems relevant to the presenting complaint

COMPLETION:
When you have gathered sufficient information (typically 6-10 exchanges), end with a JSON block EXACTLY like this:
\`\`\`json
{
  "completed": true,
  "chiefComplaints": ["..."],
  "history": "Full structured history in SOAP format",
  "summary": "2-3 sentence clinical summary for the intern",
  "redFlags": ["any red flag symptoms noted"]
}
\`\`\`

Do NOT output the JSON block until you have enough information. Until then, ask questions naturally.`;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export class BetaEngine {
  async startSession(
    department?: string,
    ageSex?: string,
    chiefComplaintHint?: string
  ): Promise<{ sessionId: string; message: string }> {
    const systemPrompt = buildSystemPrompt(department, ageSex, chiefComplaintHint);
    const sessionId = newId();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: 'Hello, I am here for my appointment.',
        },
      ],
    });

    const assistantMsg =
      response.content[0]?.type === 'text' ? response.content[0].text : 'Hello! How can I help you today?';

    betaStore.create({
      id: sessionId,
      status: 'active',
      messages: [
        { role: 'user', content: 'Hello, I am here for my appointment.', timestamp: new Date().toISOString() },
        { role: 'assistant', content: assistantMsg, timestamp: new Date().toISOString() },
      ],
      department,
      ageSex,
      chiefComplaintHint,
    });

    return { sessionId, message: assistantMsg };
  }

  async chat(sessionId: string, userMessage: string): Promise<{ message: string; completed: boolean }> {
    const session = betaStore.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.status === 'completed') {
      return { message: 'This consultation has already been completed.', completed: true };
    }

    const systemPrompt = buildSystemPrompt(session.department, session.ageSex, session.chiefComplaintHint);

    const history: { role: 'user' | 'assistant'; content: string }[] = session.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    history.push({ role: 'user', content: userMessage });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: history,
    });

    const assistantMsg =
      response.content[0]?.type === 'text' ? response.content[0].text : 'Please continue...';

    const newMessages: BetaMessage[] = [
      ...session.messages,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: assistantMsg, timestamp: new Date().toISOString() },
    ];

    // Check for completion JSON
    const jsonMatch = assistantMsg.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = extractJSON<{
          completed?: boolean;
          chiefComplaints?: string[];
          history?: string;
          summary?: string;
          redFlags?: string[];
        }>(jsonMatch[1]);

        if (parsed.completed) {
          betaStore.update(sessionId, {
            messages: newMessages,
            status: 'completed',
            summary: parsed.summary,
            complaints: parsed.chiefComplaints,
            history: parsed.history,
          });
          return { message: assistantMsg, completed: true };
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    betaStore.update(sessionId, { messages: newMessages });
    return { message: assistantMsg, completed: false };
  }
}

export const betaEngine = new BetaEngine();
