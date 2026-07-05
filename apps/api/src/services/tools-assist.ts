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
  /** One-line patient context (age/sex, EGA, working diagnosis) so questions adapt to THIS patient. */
  context?: string;
}

// How each specialty actually works a patient up — injected into the prompt so
// the AI asks like a registrar of that discipline, not a generic form-filler.
const DEPT_CLINICAL_GUIDANCE: Record<string, string> = {
  og: 'Obstetric discipline: anchor questions to gestational age (EGA/LMP). Examination follows the obstetric routine — SFH in cm vs dates, Leopold\'s maneuvers (lie, presentation, engagement in fifths), fetal heart rate and where heard, contractions, then PV exam only if indicated (dilation, effacement, station, membranes). History covers gravidity/parity detail, previous deliveries and modes, antenatal course, and gynae background (menstrual, contraception, pap smears).',
  paeds: 'Paediatric discipline: everything is age-adjusted. Ask weight-based and centile-based questions (growth curves, MUAC), developmental milestones for age, feeding/nutrition, immunisation status per EPI schedule, and always consider the caregiver as historian.',
  psych: 'Psychiatric discipline: history includes previous episodes/admissions, suicide attempts, substance use, forensic and collateral history. Examination is the MSE — appearance, behaviour, speech, mood/affect, thought form and content, perception, cognition, insight/judgement — plus an explicit risk assessment (self-harm, harm to others, self-neglect).',
  icu: 'Critical-care discipline: think in organ systems and support levels — ventilation mode/FiO2/PEEP with ABG correlation, haemodynamics with vasopressor doses, renal output/RRT, sedation scores, lines and their days in situ.',
  emergency: 'Emergency discipline: primary survey first (ABCDE with interventions), then focused secondary survey. Time-critical framing — onset times, mechanism of injury where relevant.',
  surgery: 'Surgical discipline: operative readiness matters — last oral intake (NPO status), anaesthetic history and previous GA complications, anticoagulants, and focused examination of the operative site.',
  ortho: 'Orthopaedic discipline: mechanism of injury, neurovascular status distal to any injury (pulses, sensation, motor, capillary refill), weight-bearing status, and immobilisation.',
};

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
  const guidance = DEPT_CLINICAL_GUIDANCE[req.dept];

  return `You are MedAI Scribe, an AI assistant helping a busy hospital intern on a South African ${deptLabel} ward log the "${req.section}" section of a patient record — hands-busy, eyes-off-the-screen.
${req.context ? `\nTHIS PATIENT: ${req.context}\n` : ''}${guidance ? `\nDISCIPLINE: ${guidance}\n` : ''}
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

// ─── Photo scan of handwritten notes ────────────────────────────────────────

export type ScanConfidence = 'high' | 'medium' | 'low';

export interface ScanFieldResult {
  value: string;
  confidence: ScanConfidence;
  note?: string; // e.g. "could be 'Lasix' or 'Losec' — dose suggests Lasix"
}

export interface ScanRequest {
  dept: string;
  section: string;
  fields: AssistField[];
  imageBase64: string; // raw base64, no data: prefix
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  context?: string;
}

export interface ScanResponse {
  results: Record<string, ScanFieldResult>;
  unreadable: string[]; // field keys present in the notes but not decipherable
  overallNote: string;
}

function buildScanPrompt(req: ScanRequest): string {
  const deptLabel = DEPT_LABELS[req.dept] ?? req.dept;
  const fieldList = req.fields
    .map(f => `- ${f.key}: ${f.label}${f.hint ? ` (expected: ${f.hint})` : ''}`)
    .join('\n');
  const guidance = DEPT_CLINICAL_GUIDANCE[req.dept];

  return `You are MedAI Scribe reading a photo of HANDWRITTEN clinical notes from a South African ${deptLabel} ward, to fill the "${req.section}" section of a patient record.
${req.context ? `\nTHIS PATIENT: ${req.context}\n` : ''}${guidance ? `\nDISCIPLINE (expect this kind of shorthand in the notes): ${guidance}\n` : ''}

FIELDS TO EXTRACT:
${fieldList}

DOCTORS' HANDWRITING IS POOR — you are specifically built for this:
- Use clinical context to decode scrawl: a drug name near "40mg OD" narrows the possibilities; a number after "BP" is a blood pressure.
- Expand standard clinical shorthand (c/o, Hx, PMHx, Rx, NKDA, BD/TDS/QID, SOB, #NOF) into the field value where appropriate.
- Expect South African clinical conventions and drug names.
- NEVER silently guess. Every extracted value carries a confidence:
  - "high": clearly legible or unambiguous from context
  - "medium": readable but plausibly wrong — the intern must verify
  - "low": barely legible; your best reconstruction, likely wrong
- If a field's content is present in the notes but you cannot decipher it at all, list its key under "unreadable" instead of inventing a value.
- If a field simply is not in the notes, omit it entirely (not unreadable, just absent).
- For medium/low confidence, add a short "note" saying what else it could read as, so the intern can verify quickly (e.g. "could be 'Lasix' or 'Losec' — 40mg OD suggests Lasix").

RESPONSE — ONLY a JSON object, no prose:
{
  "results": { "<fieldKey>": { "value": "...", "confidence": "high|medium|low", "note": "..." }, ... },
  "unreadable": ["<fieldKey>", ...],
  "overallNote": "<one line: legibility of the note overall, anything the intern should double-check>"
}`;
}

export class ToolsAssistEngine {
  async scanNotes(req: ScanRequest): Promise<ScanResponse> {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: req.mediaType, data: req.imageBase64 },
            },
            { type: 'text', text: buildScanPrompt(req) },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    const parsed = extractJSON<Partial<ScanResponse>>(text);
    const allowed = new Set(req.fields.map(f => f.key));

    const results: Record<string, ScanFieldResult> = {};
    for (const [k, v] of Object.entries(parsed?.results ?? {})) {
      if (!allowed.has(k) || !v || typeof v.value !== 'string') continue;
      const confidence: ScanConfidence =
        v.confidence === 'high' || v.confidence === 'medium' || v.confidence === 'low' ? v.confidence : 'low';
      results[k] = { value: v.value, confidence, note: typeof v.note === 'string' ? v.note : undefined };
    }

    const unreadable = Array.isArray(parsed?.unreadable)
      ? parsed.unreadable.filter((k): k is string => typeof k === 'string' && allowed.has(k) && !(k in results))
      : [];

    return {
      results,
      unreadable,
      overallNote: typeof parsed?.overallNote === 'string' ? parsed.overallNote : '',
    };
  }

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
