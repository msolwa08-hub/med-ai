/**
 * Obstetrics & Gynaecology (O&G) Specialized AI History Service
 *
 * Provides dedicated, focused history taking for:
 *   - OBSTETRIC consultations (pregnancy-related)
 *   - GYNAECOLOGICAL consultations (non-pregnancy reproductive health)
 *
 * Key differences from general adaptive history:
 *   - Detects O&G mode automatically (obstetric vs gynae)
 *   - Obstetric: LMP/EDD, gravida/para, ANC, fetal movements, red flag symptoms
 *   - Gynae: menstrual history, contraception, STI screening, pap smear status,
 *     pelvic pain, fertility concerns, menopause assessment
 *   - Extracts structured O&G history on completion
 *   - Generates clinical O&G summary for doctor review
 */

import { anthropic, CLAUDE_HISTORY_MODEL, CLAUDE_MODEL } from '../lib/claude.js';
import type { SaLanguage, ConversationMessage } from '../types/index.js';
import { SA_LANGUAGE_NAMES } from '../types/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OGMode = 'OBSTETRIC' | 'GYNAECOLOGICAL' | 'UNKNOWN';

export interface OGPatientContext {
  age: number;
  gravida?: number;     // Total pregnancies
  para?: number;        // Total deliveries
  lmpDate?: string;
  isPregnant?: boolean;
  gestationalAge?: string;
  knownConditions?: string[];
  currentMedications?: string[];
  language: SaLanguage;
}

export interface ObstetricHistory {
  lmp: string;
  edd: string;
  gestationalAge: string;
  gravida: string;
  para: string;
  previousPregnancies: string;
  antenatalCare: string;
  currentSymptoms: string;
  fetalMovements: string;
  redFlagsPresent: string[];
  bloodGroup?: string;
  antenatalBloodResults?: string;
  socialFactors: string;
}

export interface GynaeHistory {
  chiefComplaint: string;
  menstrualHistory: string;
  lastMenstrualPeriod: string;
  cycleLength: string;
  cycleDuration: string;
  contraceptionCurrent: string;
  contraceptionPast: string;
  sexualHistory: string;
  stiHistory: string;
  lastPapSmear: string;
  pelvicPain: string;
  fertilityHistory: string;
  menopausalStatus: string;
  vaginalDischarge: string;
  urinarySymptoms: string;
  redFlagsPresent: string[];
}

export interface OGHistoryResult {
  mode: OGMode;
  obstetricHistory?: ObstetricHistory;
  gynaeHistory?: GynaeHistory;
  clinicalSummary: string;
  managementSuggestions: string[];
  redFlags: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT' | 'EMERGENCY';
}

export interface OGSessionResponse {
  message: string;
  isComplete: boolean;
  mode: OGMode;
  redFlagDetected: boolean;
}

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildObstetricSystemPrompt(language: SaLanguage, context: OGPatientContext): string {
  const langName = SA_LANGUAGE_NAMES[language];
  const gravidaStr = context.gravida !== undefined ? `G${context.gravida}` : 'unknown gravida';
  const paraStr = context.para !== undefined ? `P${context.para}` : 'unknown para';

  return `You are MedAI O&G, a specialist obstetric AI assistant for South African healthcare professionals.
You are taking an antenatal history from a patient (${gravidaStr}${paraStr}, age ${context.age}).
Always communicate in ${langName}. Use simple, warm, non-medical language with the patient.

OBSTETRIC HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT (if any — this may be a routine ANC visit)
   - "What brings you in today? Is everything okay with the pregnancy?"

2. CURRENT PREGNANCY:
   - LMP: exact date → calculate gestational age
   - EDD (estimated delivery date)
   - Confirm planned/unplanned pregnancy (sensitively)
   - Antenatal care: "Have you been to any clinic or doctor for this pregnancy? How many visits?"
   - Fetal movements: "When did you first feel baby move? How active is baby today?" (if >18 weeks)
   - Current symptoms: nausea/vomiting, heartburn, swelling, backache, headache, visual disturbance

3. ANTENATAL SCREENING:
   - Blood group + rhesus status
   - HIV status (ask non-judgementally): "Did you get tested for HIV in this pregnancy?"
   - Syphilis/VDRL
   - Anaemia/haematinics
   - Gestational diabetes risk (glucose tolerance test)
   - Ultrasound: "Have you had any scans?"

4. OBSTETRIC HISTORY (previous pregnancies):
   - Gravida/para (how many pregnancies, how many deliveries)
   - Previous delivery modes (NVD vs caesarean — if caesarean, what was the reason?)
   - Previous complications: pre-eclampsia, GDM, PPH, preterm labour, stillbirth, neonatal loss
   - Previous neonatal birth weights

5. RED FLAGS — screen actively:
   - Severe headache + visual disturbance + epigastric pain (pre-eclampsia)
   - Vaginal bleeding at any stage
   - Reduced or absent fetal movements (>24 weeks)
   - Rupture of membranes
   - Preterm contractions (<37 weeks)
   - Fever + rigors (pyelonephritis, chorioamnionitis)
   - Sudden swelling of face/hands (pre-eclampsia)

6. MEDICAL & SURGICAL HISTORY:
   - Pre-existing conditions: hypertension, diabetes, thyroid, epilepsy, mental health
   - Current medications (including folic acid, haematinics, ARVs if applicable)
   - Allergies
   - Previous surgery (especially abdominal)

7. SOCIAL HISTORY:
   - Living situation, support structures
   - Occupation / activity level
   - Substance use: smoking, alcohol, traditional medicines (muti)
   - Domestic violence screening (sensitively, when appropriate)

8. FAMILY HISTORY:
   - Twins (maternal side — fraternal)
   - Hypertension, pre-eclampsia, diabetes in female relatives

SA CONTEXT:
- ANC protocol: 8 visits for low-risk (Bettercare/MBCHB guidelines)
- High HIV prevalence — normalize testing, ask about ART if positive
- High hypertension prevalence in pregnancy (PIH, pre-eclampsia risk)
- Referral criteria to district/regional hospital must be considered

When all sections are covered, end your message with exactly: [OG_HISTORY_COMPLETE]

CRITICAL RED FLAGS — if ANY detected, advise emergency assessment immediately:
- Active vaginal bleeding
- No fetal movements for >12 hours (after quickening)
- Severe headache + visual changes + epigastric pain
- Ruptured membranes with green/brown liquor
- Temperature >38.5°C in pregnancy
- Severe abdominal pain`;
}

function buildGynaeSystemPrompt(language: SaLanguage, context: OGPatientContext): string {
  const langName = SA_LANGUAGE_NAMES[language];

  return `You are MedAI O&G, a specialist gynaecological AI assistant for South African healthcare professionals.
You are taking a gynaecological history from a patient (age ${context.age}).
Always communicate in ${langName}. Use simple, warm, non-medical language.

GYNAECOLOGICAL HISTORY FRAMEWORK — cover ALL sections in order:

1. PRESENTING COMPLAINT:
   - Chief concern in the patient's own words
   - Duration, severity, impact on daily life

2. MENSTRUAL HISTORY:
   - LMP (last menstrual period): exact date
   - Cycle regularity: "Are your periods regular or irregular?"
   - Cycle length (days from start of one period to start of next)
   - Duration of bleeding (days of actual bleeding)
   - Amount: "Is your flow light, normal, or heavy?" → if heavy: "Do you soak through pads/tampons quickly? Pass clots?"
   - Dysmenorrhoea (period pain): severity, effect on activities
   - Intermenstrual bleeding (bleeding between periods)
   - Post-coital bleeding (bleeding after sex)

3. CONTRACEPTION:
   - Current method and duration
   - Previous methods and reasons for stopping
   - Condom use (dual protection)
   - Emergency contraception use

4. SEXUAL HISTORY (sensitive, non-judgmental):
   - Sexually active: yes/no
   - Number of partners (epidemiological — for STI risk)
   - Pain during intercourse (dyspareunia: superficial or deep)
   - Partners' symptoms if relevant

5. STI / INFECTION HISTORY:
   - Previous STIs (gonorrhoea, chlamydia, trichomoniasis, syphilis, herpes)
   - HIV status — when last tested
   - Current discharge: colour, odour, amount, itch

6. CERVICAL SCREENING (PAP SMEAR):
   - Date of last pap smear
   - Previous abnormal results
   - HPV vaccination status

7. PELVIC PAIN:
   - Location, character, radiation
   - Relation to menstrual cycle (cyclical = endometriosis, ovulation)
   - Relation to bowel or urinary function
   - Deep dyspareunia (endometriosis, PID, fibroids)

8. FERTILITY:
   - Trying to conceive? Duration
   - Previous pregnancies (obstetric history)
   - Partner fertility assessment if applicable

9. MENOPAUSE (if age-appropriate):
   - Menopausal status: pre/peri/post
   - Last period if post-menopausal
   - Vasomotor symptoms: hot flushes, night sweats
   - Urogenital atrophy symptoms
   - HRT use: current/past

10. URINARY SYMPTOMS:
    - Frequency, urgency, incontinence (stress/urge)
    - Dysuria (pain on urination)
    - Haematuria

11. MEDICAL / SURGICAL HISTORY:
    - Chronic conditions, previous pelvic surgery (D&C, hysteroscopy, laparoscopy, LSCS)
    - Medications, allergies

SA CONTEXT:
- High prevalence of HIV, TB, and STIs
- Cervical cancer screening: pap smear at age 30, 40, 50 (SA DoH guidelines)
- High prevalence of uterine fibroids in Black African women
- Limited access to specialist gynaecology — assist with referral triage
- Consider traditional medicine use (muti) and its gynaecological implications

RED FLAGS — advise urgent assessment:
- Post-menopausal bleeding
- Rapidly enlarging pelvic mass
- Severe sudden pelvic pain (ectopic, ovarian torsion, ruptured cyst)
- Heavy bleeding causing haemodynamic compromise
- Vaginal discharge with fever + lower abdominal pain + cervical motion tenderness (PID)
- Post-coital bleeding (cervical carcinoma)

When all sections are covered, end your message with exactly: [OG_HISTORY_COMPLETE]`;
}

// ─── Mode Detection ───────────────────────────────────────────────────────────

export async function detectOGMode(
  chiefComplaint: string,
  age: number,
  isKnownPregnant?: boolean
): Promise<OGMode> {
  if (isKnownPregnant === true) return 'OBSTETRIC';

  const prompt = `Classify this patient's O&G concern as OBSTETRIC or GYNAECOLOGICAL.
Patient age: ${age}
Chief complaint: "${chiefComplaint}"

Reply with ONLY one word: OBSTETRIC or GYNAECOLOGICAL`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 10,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .toUpperCase();
    if (text === 'OBSTETRIC' || text === 'GYNAECOLOGICAL') return text;
    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

// ─── Session Functions ────────────────────────────────────────────────────────

export async function startOGHistorySession(
  mode: OGMode,
  patientName: string,
  language: SaLanguage,
  context: OGPatientContext
): Promise<OGSessionResponse> {
  const systemPrompt =
    mode === 'OBSTETRIC'
      ? buildObstetricSystemPrompt(language, context)
      : buildGynaeSystemPrompt(language, context);

  const openingInstruction =
    mode === 'OBSTETRIC'
      ? `Greet ${patientName} warmly. Start the obstetric history by asking how she is feeling today and about her chief complaint (if any). Then begin gathering the obstetric history systematically.`
      : `Greet ${patientName} warmly and professionally. Begin the gynaecological consultation by asking what brings her in today.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: openingInstruction }],
  });

  const message = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const isComplete = message.includes('[OG_HISTORY_COMPLETE]');

  return {
    message: message.replace('[OG_HISTORY_COMPLETE]', '').trim(),
    isComplete,
    mode,
    redFlagDetected: detectOGRedFlags(message),
  };
}

export async function continueOGHistorySession(
  conversationHistory: ConversationMessage[],
  patientMessage: string,
  mode: OGMode,
  language: SaLanguage,
  context: OGPatientContext
): Promise<OGSessionResponse> {
  const systemPrompt =
    mode === 'OBSTETRIC'
      ? buildObstetricSystemPrompt(language, context)
      : buildGynaeSystemPrompt(language, context);

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: patientMessage },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_HISTORY_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  const message = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const isComplete = message.includes('[OG_HISTORY_COMPLETE]');

  return {
    message: message.replace('[OG_HISTORY_COMPLETE]', '').trim(),
    isComplete,
    mode,
    redFlagDetected: detectOGRedFlags(message + ' ' + patientMessage),
  };
}

// ─── History Extraction ───────────────────────────────────────────────────────

export async function extractOGHistory(
  conversationHistory: ConversationMessage[],
  mode: OGMode,
  context: OGPatientContext
): Promise<OGHistoryResult> {
  const conversationText = conversationHistory
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Patient'}: ${m.content}`)
    .join('\n');

  const obstetricSchema = `{
  "mode": "OBSTETRIC",
  "obstetricHistory": {
    "lmp": "string",
    "edd": "string",
    "gestationalAge": "string",
    "gravida": "string",
    "para": "string",
    "previousPregnancies": "string",
    "antenatalCare": "string",
    "currentSymptoms": "string",
    "fetalMovements": "string",
    "redFlagsPresent": ["array of strings"],
    "bloodGroup": "string or null",
    "antenatalBloodResults": "string",
    "socialFactors": "string"
  },
  "clinicalSummary": "string — concise clinical summary for doctor",
  "managementSuggestions": ["array of strings — SA ANC protocol suggestions"],
  "redFlags": ["array of strings — identified red flags"],
  "urgency": "ROUTINE | SOON | URGENT | EMERGENCY"
}`;

  const gynaeSchema = `{
  "mode": "GYNAECOLOGICAL",
  "gynaeHistory": {
    "chiefComplaint": "string",
    "menstrualHistory": "string",
    "lastMenstrualPeriod": "string",
    "cycleLength": "string",
    "cycleDuration": "string",
    "contraceptionCurrent": "string",
    "contraceptionPast": "string",
    "sexualHistory": "string",
    "stiHistory": "string",
    "lastPapSmear": "string",
    "pelvicPain": "string",
    "fertilityHistory": "string",
    "menopausalStatus": "string",
    "vaginalDischarge": "string",
    "urinarySymptoms": "string",
    "redFlagsPresent": ["array of strings"]
  },
  "clinicalSummary": "string — concise clinical summary for doctor",
  "managementSuggestions": ["array of strings — management suggestions"],
  "redFlags": ["array of strings — identified red flags"],
  "urgency": "ROUTINE | SOON | URGENT | EMERGENCY"
}`;

  const schema = mode === 'OBSTETRIC' ? obstetricSchema : gynaeSchema;

  const extractionPrompt = `Extract a structured ${mode.toLowerCase()} history from this conversation.
Patient age: ${context.age}, language: ${context.language}

CONVERSATION:
${conversationText}

Return ONLY valid JSON matching this schema:
${schema}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0,
    messages: [{ role: 'user', content: extractionPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');

  if (start === -1 || end === -1) {
    return {
      mode,
      clinicalSummary: 'History extraction failed — see conversation log.',
      managementSuggestions: [],
      redFlags: [],
      urgency: 'ROUTINE',
    };
  }

  return JSON.parse(jsonStr.slice(start, end + 1)) as OGHistoryResult;
}

// ─── Red Flag Detection ───────────────────────────────────────────────────────

function detectOGRedFlags(text: string): boolean {
  const flags = [
    'bleeding', 'blood', 'bleed',
    'no movement', 'not moving', 'stopped moving', 'reduced movement',
    'severe headache', 'vision', 'visual', 'flashing',
    'chest pain', 'shortness of breath',
    'collapse', 'unconscious', 'fitting', 'seizure',
    'severe pain', 'excruciating',
    'ruptured', 'waters broke', 'gushing',
    'ectopic', 'torsion',
    'postmenopausal bleeding',
    'fever in pregnancy',
  ];
  const lower = text.toLowerCase();
  return flags.some((f) => lower.includes(f));
}
