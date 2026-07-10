import Anthropic from '@anthropic-ai/sdk';
import { extractJSON } from '../lib/json-extract.js';
import { protocolStore } from './protocol-store.js';
import { specialtyLens } from './hod-prompt.js';
import { MODELS, createMessage } from '../lib/models.js';

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
  medicine: 'Internal-medicine discipline: reason syndrome-first — dyspnoea, chest pain, confusion, fever — and work each to a weighted differential rather than a label. Chronic disease is characterised by its CONTROL, not its presence: last HbA1c/BP/creatinine, complications, adherence, and what changed to cause THIS admission. Functional baseline (exercise tolerance before this illness) is the yardstick every finding is measured against. In the SA context every medical admission gets an HIV status (if positive: regimen, adherence, last VL/CD4 — CD4 <200 changes the whole differential) and a TB symptom screen (any one of cough, fever, night sweats, weight loss → sputum GeneXpert). Interpret investigations as trends against baseline — a creatinine of 140 means nothing until you know last month\'s.',
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
  'og:labour': 'Labour ward: this patient IS in labour — the structured VE and the partogram are the core of the assessment, not optional extras. The VE is captured element by element: cervical dilation (cm), effacement, station relative to the ischial spines, membranes (intact vs ruptured, time of ROM) and liquor colour (clear / meconium and its grade), caput and moulding, position — and abdominal palpation (descent in fifths above the brim) comes BEFORE every VE, because once caput forms, station alone overstates progress. Contractions are quantified (per 10 min, duration, strength — adequate labour is 3-4 in 10 lasting ≥40s). EVERYTHING is plotted on the partogram in real time: active labour from 4cm expects ≥1cm/hr (the alert line); crossing the ACTION line 4 hours later mandates a decision — ARM/oxytocin if no CPD, or CS/transfer — never just another period of observation. FHR is auscultated AFTER a contraction (late decelerations live in that minute), half-hourly in active labour. Maternal obs (BP, pulse hourly; temp 4-hourly) go on the same partogram. If HIV-positive, confirm intrapartum ART/PMTCT plan (continue ART, infant NVP/AZT prophylaxis plan) — this must not be missed at this stage.',
  'og:postnatal': 'Postnatal ward: the pregnancy has ended — do NOT ask about fetal heart, Leopold\'s, or contractions. MODE OF DELIVERY IS THE ROOT QUESTION and the whole assessment branches on it: establish NVD vs assisted (vacuum/forceps) vs EMCS vs ELCS first, with the CS indication (EMCS carries higher sepsis and thromboembolic risk than ELCS, and the indication decides VBAC counselling for the next pregnancy — cover it before discharge). Post-NVD/assisted → perineum (intact / tear GRADED 1st-4th degree / episiotomy, repair intact, no haematoma), lochia (amount, colour, odour — inspect the pad), fundal involution. Post-CS → wound inspection (sepsis declares around day 3, exactly when she is being discharged), return of bowel function, thromboprophylaxis charted AND given. Both → day-post-delivery framing for every finding, PPH risk (boggy/high fundus = atony or retained products), breastfeeding with the latch OBSERVED, voided since delivery (retention hides after epidurals/instrumental), rhesus/anti-D check, contraception plan BEFORE discharge, and a postnatal mood screen (EPDS — the legitimate psychiatric exception on this ward; any self-harm thought is a referral). If HIV-positive, confirm maternal ART continuation and that the infant is on PMTCT prophylaxis with a follow-up/PCR test booked.',
  'og:gynae': 'Gynaecology ward: not assumed pregnant — confirm pregnancy status if relevant (e.g. ?ectopic) rather than asking obstetric-routine questions by default. Focus on menstrual/bleeding pattern, pelvic pain characteristics, and pelvic/bimanual/speculum exam findings (masses, tenderness, discharge, cervical findings) instead of SFH/Leopold\'s/fetal heart.',
  'paeds:general': 'General paediatric ward: age-appropriate developmental milestones, feeding pattern, and immunisation status as usual.',
  'paeds:neonatal': 'Neonatal/nursery: this is a newborn — do NOT ask about developmental milestones (too early). Frame everything by DAY OF LIFE: bilirubin thresholds, expected weight change (up to 10% loss physiological, regained by day 10-14), feed volumes (start ~60 ml/kg/day, advance to 150-180), sepsis pattern (day 0-3 maternal origin vs later environmental). Ask birth details (gestation, birth weight, delivery mode, APGARs 1/5min, resuscitation), maternal/perinatal risk (HIV + PMTCT, RPR result and treatment, ROM ≥18h, maternal fever), current feeding in ml/kg/day actually taken, jaundice anchored to HOURS of life (visible <24h is always pathological), and the neonatal danger signs — poor feeding, temperature instability (hypothermia counts more than fever), apnoea, convulsions, lethargy: any one means presumed sepsis.',
  'paeds:malnutrition': 'Malnutrition/SAM corner: the WHO ten steps govern everything and normal paediatric resuscitation is INVERTED here. Confirm the diagnosis in numbers (weight, WHZ plotted, MUAC — <11.5cm at 6-59 months = SAM; bilateral pitting oedema graded +/++/+++ = SAM regardless of weight). First-day questions: glucose checked (hypoglycaemia kills in the first 48h and looks like quietness), temperature (hypothermia = sepsis or hypoglycaemia until proven otherwise), hydration assessed CAUTIOUSLY (SAM mimics every dehydration sign; ReSoMal orally, IV fluids only in true shock), feeding phase (F-75 stabilisation first — pushing volume/protein early kills via refeeding syndrome and cardiac failure; transition to F-100/RUTF only when oedema settles and appetite returns), appetite test with RUTF (failed appetite = complicated SAM = inpatient), routine broad-spectrum antibiotics (SAM mounts no fever and no white count), and the household diagnosis — HIV test this admission, TB contact screen, food security, grants (CSG), who feeds the child.',
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

/**
 * The system prompt is split into a STATIC prefix (identical on every turn of a
 * clerking — persona, specialty lens, discipline guidance, working rules) and a
 * DYNAMIC tail (this patient's context, protocol match, current field values).
 * The static prefix carries cache_control so turns 2+ of a conversation read it
 * from the prompt cache at ~10% of input price — the single biggest cost lever
 * on the app's most-called endpoint.
 */
function buildSystemBlocks(req: AssistRequest): { staticPart: string; dynamicPart: string } {
  const deptLabel = DEPT_LABELS[req.dept] ?? req.dept;
  const fieldList = req.fields
    .map(f => `- ${f.key}: ${f.label}${f.hint ? ` (${f.hint})` : ''} — ${f.value ? `already recorded: "${f.value}"` : 'MISSING'}`)
    .join('\n');
  const guidance = clinicalGuidanceFor(req.dept, req.subDept);
  const queryText = [req.context, ...req.fields.map(f => `${f.label} ${f.value}`), ...req.transcript.map(t => t.content)].join(' ');
  const protocolBlock = facilityProtocolBlock(req.dept, queryText);

  const staticPart = `You are MedAI Scribe, an AI assistant helping a busy hospital intern on a South African ${deptLabel} ward log the "${req.section}" section of a patient record — hands-busy, eyes-off-the-screen.

${specialtyLens(req.dept, req.subDept)}
${guidance ? `\nDISCIPLINE: ${guidance}\n` : ''}
HOW YOU WORK (fast — the intern is clerking efficiently, not a nervous patient; your job is to MINIMISE turns):
1. GROUP fields that are naturally answered together into ONE question — never ask administrative fields one at a time. E.g. "Name, age, ward and bed?" · "Gestational age, LMP and EDD?" · "Gravida, para, and previous deliveries?" · "HIV status — and if positive, regimen and last viral load?". Aim to close each SECTION in as few questions as possible.
2. OPEN by gathering the whole administrative block in one question (name, age, sex, ward, bed, admission date), then move through the clinical fields in a few grouped questions.
3. From each answer, extract EVERY field it covers — interns rattle several off at once ("32, G3P2, 34 weeks, HIV+ on TLD"): capture ALL of them in "updates", not just the one you asked about.
4. Drill down to a SINGLE focused question only when the answer needs clarification, or the field is clinically important enough to isolate (exact BP in pre-eclampsia, the viral-load number, allergy specifics).
5. Never re-ask a field already recorded (see the list — filled fields are marked) unless the intern corrects it. If they say "skip"/"none"/"unknown"/"not sure", record "—" or the stated value and MOVE ON — never loop on the same field twice.
6. Use clinical shorthand (NKDA, PMH, HPI, obs). Keep questions terse.
7. When every field has a value (or was skipped), set "done": true with a one-line confirmation summary, not a question.

RESPONSE FORMAT — reply with ONLY a JSON object, no prose before or after:
{
  "updates": { "<fieldKey>": "<extracted value>", ... },
  "nextQuestion": "<your next question (which may ask for several related fields at once), or the confirmation line when done>",
  "done": false
}

"updates" must contain only fields whose value you extracted or corrected from the intern's LAST message (empty object on the first turn). Normalise dates to YYYY-MM-DD and keep clinical values verbatim.`;

  const dynamicPart = `${req.context ? `THIS PATIENT: ${req.context}\n` : ''}${protocolBlock}
THE FIELDS TO CAPTURE:
${fieldList}`;

  return { staticPart, dynamicPart };
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

// ─── Quick parse — the brain-dump fast path ─────────────────────────────────
// The intern already knows the story. Instead of a question-at-a-time
// conversation, they dump the whole clerking in one go (typed or dictated) and
// this extracts EVERY field it can find in a single call — ~1 round-trip vs ~6.
// Same specialty lens + guidance as the conversational assist; no questions,
// just structured capture, with a confidence flag so a low-certainty parse gets
// verified rather than trusted.

export interface QuickParseRequest {
  dept: string;
  subDept?: string;
  section: string;
  fields: AssistField[];
  text: string; // the brain-dump (free text or dictation transcript)
  context?: string;
}

export interface QuickParseResponse {
  results: Record<string, ScanFieldResult>; // reuse the scan shape: value + confidence + note
  overallNote: string;
}

function buildQuickParsePrompt(req: QuickParseRequest): { staticPart: string; dynamicPart: string } {
  const deptLabel = DEPT_LABELS[req.dept] ?? req.dept;
  const fieldList = req.fields
    .map(f => `- ${f.key}: ${f.label}${f.hint ? ` (${f.hint})` : ''}${f.value ? ` — already recorded: "${f.value}"` : ''}`)
    .join('\n');
  const guidance = clinicalGuidanceFor(req.dept, req.subDept);
  const protocolBlock = facilityProtocolBlock(req.dept, [req.context, req.text].join(' '));

  const staticPart = `You are MedAI Scribe on a South African ${deptLabel} ward. A busy intern has just DUMPED everything they know about a patient in one go — typed or spoken aloud while examining — to fill the "${req.section}" section in a single pass. Your job is to structure that dump into the record fast and faithfully, asking NOTHING.

${specialtyLens(req.dept, req.subDept)}
${guidance ? `\nDISCIPLINE (expect this shorthand): ${guidance}\n` : ''}
HOW YOU PARSE:
- Extract EVERY field the dump covers — interns rattle several off in one breath ("54 male, crushing chest pain 2 hours, diaphoretic, known HTN and diabetic, BP 148 over 92, sats 96"). Map each to its field key.
- Expand standard clinical shorthand (c/o, Hx, PMHx, Rx, NKDA, BD/TDS/QID, SOB, G3P2) into the value.
- Dictation is messy — homophones and run-ons are expected ("be pee one forty eight" = BP 148; "sats" = SpO2). Use clinical context to reconstruct, and normalise dates to YYYY-MM-DD.
- Do NOT invent, and do NOT pad. If a field is NOT in the dump, OMIT it entirely — never emit a placeholder like "not documented"/"not mentioned"; a field the intern didn't mention simply does not appear in "results". This keeps the response tight.
- Only emit a "note" for a field you DID extract but are unsure about (medium/low). Never write a note explaining why an absent field is absent — put anything the intern should still gather into "overallNote" instead.
- confidence: "high" = clearly stated; "medium" = inferred/plausibly wrong; "low" = a guess worth checking.
- Do NOT overwrite an already-recorded field unless the dump clearly restates or corrects it.

RESPONSE — ONLY a JSON object, no prose:
{
  "results": { "<fieldKey>": { "value": "...", "confidence": "high|medium|low", "note": "..." }, ... },
  "overallNote": "<one line: anything the intern should double-check, or empty>"
}`;

  const dynamicPart = `${req.context ? `THIS PATIENT (already on record): ${req.context}\n` : ''}${protocolBlock}
FIELDS TO FILL:
${fieldList}

THE INTERN'S DUMP:
"""
${req.text}
"""`;

  return { staticPart, dynamicPart };
}

export class ToolsAssistEngine {
  async quickParse(req: QuickParseRequest): Promise<QuickParseResponse> {
    const { staticPart, dynamicPart } = buildQuickParsePrompt(req);
    const run = (maxTokens: number, extra: string) =>
      createMessage({
        model: MODELS.reasoning,
        max_tokens: maxTokens,
        system: [
          // Static prefix (persona + lens + guidance) is stable per department →
          // cached; the dump + fields change each call.
          { type: 'text', text: staticPart, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: dynamicPart + extra },
        ],
        messages: [{ role: 'user', content: 'Parse the dump into the fields now.' }],
      });

    const readText = (r: Awaited<ReturnType<typeof run>>) =>
      r.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('');
    const tryParse = (t: string): Partial<QuickParseResponse> | null => {
      try { return extractJSON<Partial<QuickParseResponse>>(t); } catch { return null; }
    };

    // A verbose dump with many offered fields can overrun the budget → truncated
    // JSON → empty parse. One retry with more room + a terse directive recovers
    // it (same failure mode the confidence engine guards against).
    let response = await run(2600, '');
    let parsed = tryParse(readText(response));
    if (!parsed || !parsed.results || Object.keys(parsed.results).length === 0) {
      response = await run(
        4000,
        '\n\nIMPORTANT: keep the JSON compact — OMIT every field not in the dump (no placeholder entries), one short note only where truly needed. Return the JSON object only.'
      );
      parsed = tryParse(readText(response));
    }
    const allowed = new Set(req.fields.map(f => f.key));
    const results: Record<string, ScanFieldResult> = {};
    for (const [k, v] of Object.entries(parsed?.results ?? {})) {
      if (!allowed.has(k) || !v || typeof v.value !== 'string' || !v.value.trim()) continue;
      const confidence: ScanConfidence =
        v.confidence === 'high' || v.confidence === 'medium' || v.confidence === 'low' ? v.confidence : 'medium';
      results[k] = { value: v.value, confidence, note: typeof v.note === 'string' ? v.note : undefined };
    }
    return {
      results,
      overallNote: typeof parsed?.overallNote === 'string' ? parsed.overallNote : '',
    };
  }

  async scanNotes(req: ScanRequest): Promise<ScanResponse> {
    const response = await createMessage({
      model: MODELS.reasoning,
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
    const { staticPart, dynamicPart } = buildSystemBlocks(req);

    // The Anthropic API requires the first message to be role 'user' and roles
    // to alternate. The client's transcript starts with the assistant's opening
    // question, so we always lead with a user primer — this both satisfies the
    // API and keeps the flow going deep into a long conversation.
    const primed: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: 'Ready — ask me the first question.' },
    ];
    // Collapse any accidental consecutive same-role turns so alternation holds
    // no matter what the client sends.
    for (const t of req.transcript) {
      const role = t.role === 'assistant' ? 'assistant' : 'user';
      // Anthropic rejects empty message content — coerce blanks (a skipped
      // answer) to a placeholder so a bare Enter never 500s the flow.
      const content = (typeof t.content === 'string' ? t.content : '').trim() || '(no answer given)';
      const last = primed[primed.length - 1];
      if (last.role === role) last.content = `${last.content}\n${content}`;
      else primed.push({ role, content });
    }
    // Must end on a user turn for the model to answer.
    const messages =
      primed[primed.length - 1].role === 'assistant'
        ? [...primed, { role: 'user' as const, content: 'Continue.' }]
        : primed;

    const response = await createMessage({
      model: MODELS.reasoning,
      max_tokens: 800,
      system: [
        { type: 'text', text: staticPart, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamicPart },
      ],
      messages,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    // extractJSON THROWS on a non-JSON reply. The model occasionally returns a
    // plain-text question instead of the JSON envelope, especially deep in a
    // nuanced history — and that plain question is itself perfectly usable. So
    // parse defensively: a failed parse becomes the next question and the
    // conversation continues, instead of a 500 that dead-ends the flow.
    let parsed: Partial<AssistResponse> | null = null;
    try {
      parsed = extractJSON<Partial<AssistResponse>>(text);
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed.nextQuestion !== 'string') {
      const q = text.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      return { updates: {}, nextQuestion: q || 'Could you tell me a bit more?', done: false };
    }

    const updates: Record<string, string> = {};
    const allowed = new Set(req.fields.map(f => f.key));
    for (const [k, v] of Object.entries(parsed.updates ?? {})) {
      if (allowed.has(k) && typeof v === 'string') updates[k] = v;
    }

    // Deterministic completeness guard. The model sometimes declares "done"
    // while half the section is still empty (the efficiency + stressed-load
    // evals saw it close at 5/10 and 8/10 fields) — losing the turns spent AND
    // the missing data. If it claims done but fields remain genuinely blank
    // (no prior value and nothing extracted this turn), override to a single
    // grouped question for exactly those fields, so the section actually closes
    // full. A field the intern explicitly skipped carries a value ("—"/stated),
    // so this never re-nags a deliberate skip.
    let done = parsed.done === true;
    let nextQuestion = parsed.nextQuestion;
    if (done) {
      const stillMissing = req.fields.filter(
        f => !(f.value && f.value.trim()) && !(updates[f.key] && updates[f.key].trim())
      );
      if (stillMissing.length > 0) {
        done = false;
        const labels = stillMissing.map(f => f.label).join(', ');
        nextQuestion = `Before we finish — I still need: ${labels}. (Say "skip" for any that don't apply.)`;
      }
    }

    return { updates, nextQuestion, done };
  }
}

export const toolsAssist = new ToolsAssistEngine();
