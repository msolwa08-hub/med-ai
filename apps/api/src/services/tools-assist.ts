import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';
import { protocolStore } from './protocol-store.js';
import { specialtyLens } from './hod-prompt.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

// Best-matching excerpt from this facility's own uploaded protocols, if any —
// layered above the generic discipline guidance below. Built from whatever
// clinical text we have at this point (context line + fields + transcript so
// far); cheap enough to run on every turn.
function facilityProtocolBlock(dept: string, queryText: string): string {
  const matches = protocolStore.match(queryText, dept, 1);
  if (matches.length === 0) return '';
  return `\nTHIS FACILITY'S OWN PROTOCOL (uploaded locally — follow it over generic guidance where it gives a specific instruction): [${matches[0].title}] ${matches[0].excerpt}\n`;
}

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
  /** Ward/unit within the department (e.g. og:labour vs og:antenatal) — narrows the discipline guidance further. */
  subDept?: string;
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

// Ward-level refinement within a department — a labour-ward patient and an
// antenatal-clinic patient are both "O&G" but need entirely different
// questioning. Keyed as "<deptId>:<subDeptId>"; falls back to the plain
// DEPT_CLINICAL_GUIDANCE above when no sub-department is selected or matched.
const SUBDEPT_CLINICAL_GUIDANCE: Record<string, string> = {
  'og:antenatal': 'Antenatal ward: this is a booked, usually not-yet-labouring pregnancy. Focus on risk-screening — BP trend and proteinuria (pre-eclampsia), symphysis-fundal height growth trend, fetal movements, and any bleeding/leaking. Vaginal exam is NOT routine here — only if there is a specific indication (bleeding, ?ROM, ?labour). Frame contractions as "any tightenings?" rather than assuming labour. Always establish HIV status (ask non-judgementally; if positive, ART regimen, adherence, and last viral load — this is PMTCT, not incidental) and confirm iron/folate/calcium supplementation is actually being taken, not just prescribed. Ask how many antenatal visits she has had this pregnancy and compare against the SA BANC-Plus schedule (contacts at booking, ~20, 26, 30, 34, 36, 38, 40 weeks) — flag if she is behind for her gestational age.',
  'og:labour': 'Labour ward: this patient IS in labour — treat contractions, cervical dilation/effacement/station, and membrane/liquor status as core, expected findings, not "if indicated". Ask about frequency and strength of contractions, CTG/fetal monitoring trace, analgesia given, and progress on the partogram. Vaginal exam findings are central here, not optional. If HIV-positive, confirm intrapartum ART/PMTCT plan (continue ART, infant NVP/AZT prophylaxis plan) — this must not be missed at this stage.',
  'og:postnatal': 'Postnatal ward: the pregnancy has ended — do NOT ask about fetal heart, Leopold\'s, or contractions. Instead ask about mode of delivery and when, perineal/wound condition, lochia (amount, colour, odour), uterine involution (fundal height postnatally, is it well contracted), breastfeeding, and the baby\'s wellbeing. If HIV-positive, confirm maternal ART continuation and that the infant is on PMTCT prophylaxis with a follow-up/PCR test booked.',
  'og:gynae': 'Gynaecology ward: not assumed pregnant — confirm pregnancy status if relevant (e.g. ?ectopic) rather than asking obstetric-routine questions by default. Focus on menstrual/bleeding pattern, pelvic pain characteristics, and pelvic/bimanual/speculum exam findings (masses, tenderness, discharge, cervical findings) instead of SFH/Leopold\'s/fetal heart.',
  'paeds:general': 'General paediatric ward: age-appropriate developmental milestones, feeding pattern, and immunisation status as usual.',
  'paeds:neonatal': 'Neonatal/nursery: this is a newborn — do NOT ask about developmental milestones (too early). Instead ask birth details (gestation at birth, birth weight, delivery mode, APGAR scores), current feeding (breast/formula/NG, volumes, tolerance), jaundice (visible extent, phototherapy), and neonatal reflexes/tone for a baby this age.',
};

function clinicalGuidanceFor(dept: string, subDept?: string): string | undefined {
  if (subDept) {
    const specific = SUBDEPT_CLINICAL_GUIDANCE[`${dept}:${subDept}`];
    if (specific) return specific;
  }
  return DEPT_CLINICAL_GUIDANCE[dept];
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
  const guidance = clinicalGuidanceFor(req.dept, req.subDept);
  const queryText = [req.context, ...req.fields.map(f => `${f.label} ${f.value}`), ...req.transcript.map(t => t.content)].join(' ');
  const protocolBlock = facilityProtocolBlock(req.dept, queryText);

  return `You are MedAI Scribe, an AI assistant helping a busy hospital intern on a South African ${deptLabel} ward log the "${req.section}" section of a patient record — hands-busy, eyes-off-the-screen.

${specialtyLens(req.dept, req.subDept)}
${req.context ? `\nTHIS PATIENT: ${req.context}\n` : ''}${guidance ? `\nDISCIPLINE: ${guidance}\n` : ''}${protocolBlock}
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
  subDept?: string;
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
  const guidance = clinicalGuidanceFor(req.dept, req.subDept);
  const protocolBlock = facilityProtocolBlock(req.dept, [req.context, ...req.fields.map(f => f.label)].join(' '));

  return `You are MedAI Scribe reading a photo of HANDWRITTEN clinical notes from a South African ${deptLabel} ward, to fill the "${req.section}" section of a patient record.

${specialtyLens(req.dept, req.subDept)}
${req.context ? `\nTHIS PATIENT: ${req.context}\n` : ''}${guidance ? `\nDISCIPLINE (expect this kind of shorthand in the notes): ${guidance}\n` : ''}${protocolBlock}

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
