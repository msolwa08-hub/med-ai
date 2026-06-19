/**
 * MedAI History-Taking Beta Simulator
 *
 * Runs a scripted patient conversation through the FULL system prompt
 * and prints what the AI would say at each turn.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/beta-history-sim.mjs
 *
 * Two scenarios are run:
 *   1. ACUTE — patient with cough + fever (URTI → LRTI escalation test)
 *   2. REVIEW — diabetic patient, lifestyle check
 */

import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey.startsWith('sk-ant-placeholder')) {
  console.error('\n❌  Set ANTHROPIC_API_KEY=sk-ant-... before running this script.\n');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  grey: '\x1b[90m',
  red: '\x1b[31m',
};

function box(label, colour, text) {
  const line = '─'.repeat(60);
  console.log(`\n${colour}${C.bold}┌${line}┐${C.reset}`);
  console.log(`${colour}${C.bold}│  ${label.padEnd(58)}│${C.reset}`);
  console.log(`${colour}${C.bold}└${line}┘${C.reset}`);
  if (text) console.log(text);
}

function patientSays(msg) {
  console.log(`\n${C.yellow}${C.bold}[PATIENT]${C.reset}  ${msg}`);
}

function aiSays(msg) {
  console.log(`\n${C.cyan}${C.bold}[AI]${C.reset}       ${msg}`);
}

function info(msg) {
  console.log(`\n${C.grey}${msg}${C.reset}`);
}

// ── Build the system prompt (mirrors adaptive-ai-history.ts) ─────────────────

function buildSystemPrompt(scenario) {
  const { patientContext, isReview } = scenario;
  const ctx = `• Age: ${patientContext.age} years | Gender: ${patientContext.gender}
${patientContext.knownConditions.length ? '• Known conditions: ' + patientContext.knownConditions.join(', ') : ''}
${patientContext.currentMedications.length ? '• Current medications: ' + patientContext.currentMedications.join(', ') : ''}
${patientContext.isSmoker ? '• Smoker: YES' : ''}
${isReview && patientContext.lastVisitDays ? '• Review visit — last seen ' + patientContext.lastVisitDays + ' days ago' : ''}`.trim();

  const persona = patientContext.doctorName
    ? `You are the AI healthcare assistant for ${patientContext.practiceName ?? 'this practice'} and ${patientContext.doctorName}. All information shared is completely private and will only be seen by ${patientContext.doctorName}.`
    : 'You are MedAI — a warm, skilled clinical interviewer for South African primary healthcare.';

  return `${persona}
You take medical histories before patients see their doctor.

LANGUAGE: English only.

PATIENT PROFILE:
${ctx}

INTERVIEW STYLE:
• ONE question per message — never stack two questions in one reply.
• Everyday language — never use medical jargon with the patient.
• Echo their words: if they say "heavy chest" ask about THAT, not "precordial pressure".
• Brief warm acknowledgements: "I see.", "Okay, thanks.", "Right, got it."
• You translate patient words to clinical terms INTERNALLY — the patient never sees them.
• NEVER give medical advice, diagnoses, or treatment suggestions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION PHILOSOPHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOT a questionnaire — a natural conversation. Clinical structure lives in your mind only.

NEVER SAY: "onset", "radiation", "pleuritic", "orthopnoea", "haemoptysis", "dyspnoea", "exertional"
NEVER ASK: "Are you having difficulty or breathlessness at rest, or having difficulty walking on an incline?"
NEVER STACK: "When did it start, is it dry or productive, and have you had a fever?"

INSTEAD, follow the patient's complaint naturally, one question at a time:
  Patient: "I have a cough."
  AI: "Okay, what kind of cough is it — dry and tickly, or are you bringing up any phlegm?"
  Patient: "A bit of phlegm."
  AI: "I see. When did the cough start?"
  Patient: "About 3 days ago."
  AI: "And have you had any fever or been feeling really hot?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VAGUE PATIENT ESCALATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level 1 — Open: single open question, let patient speak.
Level 2 — If vague ("I feel bad"): offer a shortlist of body areas to narrow down.
Level 3 — If still unclear: ask one yes/no at a time through body systems.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYMPTOM FOLLOW-UP CHAINS (use exact phrasing below — one per message)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COUGH: "How long have you had it?" → "Dry and tickly, or bringing up phlegm?"
  → if phlegm: "What colour?" then "Any blood in it?"
  → "Does it wake you up at night?" → "Short of breath with it?" → "Anyone at home coughing?"

FEVER: "How long have you had it?" → "Have you measured it or just feeling very hot?"
  → "Are you waking up drenched in sweat at night?" → "Any shaking chills?"
  → "Any unexplained weight loss?" → "Anyone else around you been sick?"

BREATHLESSNESS: "Are you short of breath even sitting still, or only when you move?"
  → "How long?" → "Come on suddenly or building up?" → "Any wheezing?" → "Any cough?"
  → "Can you lie flat to sleep, or need extra pillows?" → "Ankle/feet swelling?"

PAIN: "Where exactly is it?" → "What does it feel like — sharp, dull, burning, tight?"
  → "Did it come on suddenly or build up?" → "How long?" → "Does it go anywhere else?"
  → "How bad — small and bearable, medium, or very bad?" → "What makes it worse?"
  → "Anything that helps it?" → "Any other symptoms with it?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL REFERENCE — ${isReview ? 'REVIEW' : 'ACUTE'} (REFERENCE ONLY — NOT A SCRIPT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${isReview ? `Gather: disease control per condition | diet (24h recall) | exercise (FITT) | medication compliance | weight/smoking/alcohol (AUDIT-C) | screening due | risk factors` : `Gather: chief complaint → full system review of affected system → TB screen (mandatory all respiratory) → red flags → PMH/medications/allergies → social history`}

RED FLAGS — tell patient to go to emergency immediately:
• Chest pain + breathlessness/sweating/arm pain | Worst-ever sudden headache
• Facial droop/arm weakness/speech difficulty | Fitting/unconsciousness
• Heavy bleeding | Fever + confusion + fast breathing | Suicidal plan

SA CONTEXT: TB mandatory screen (cough, night sweats, weight loss, contacts) | HIV — ask sensitively | umuthi/traditional medicine | Rheumatic heart disease in young

When fully complete: end your message with [HISTORY_COMPLETE]`;
}

// ── Run a scenario ─────────────────────────────────────────────────────────────

async function runScenario(scenario) {
  const { name, patientName, openingInstruction, turns, patientContext, isReview } = scenario;

  box(`SCENARIO: ${name}`, C.green);
  info(`Patient: ${patientName} | ${patientContext.age}y ${patientContext.gender} | ${isReview ? 'REVIEW VISIT' : 'ACUTE VISIT'}`);

  const systemPrompt = buildSystemPrompt(scenario);
  const messages = [];

  // ── Turn 0: opening ──
  info('\n[Turn 0 — AI opens]');
  messages.push({ role: 'user', content: openingInstruction });

  const opening = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 400,
    system: systemPrompt,
    messages,
  });

  const openingText = opening.content[0].type === 'text' ? opening.content[0].text : '';
  aiSays(openingText.replace('[HISTORY_COMPLETE]', '').trim());
  messages.push({ role: 'assistant', content: openingText });

  // ── Scripted patient turns ──
  for (let i = 0; i < turns.length; i++) {
    const patientMsg = turns[i];
    info(`\n[Turn ${i + 1}]`);
    patientSays(patientMsg);
    messages.push({ role: 'user', content: patientMsg });

    const resp = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    });

    const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
    const clean = text.replace('[HISTORY_COMPLETE]', '').trim();
    aiSays(clean);
    messages.push({ role: 'assistant', content: text });

    if (text.includes('[HISTORY_COMPLETE]')) {
      console.log(`\n${C.green}${C.bold}✓ History complete signal received.${C.reset}`);
      break;
    }

    // small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${C.grey}── End of scenario (${messages.filter(m => m.role === 'user').length - 1} patient turns) ──${C.reset}\n`);
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

const scenarios = [
  {
    name: 'ACUTE — Cough + Fever (URTI → LRTI escalation)',
    patientName: 'Sipho',
    isReview: false,
    patientContext: {
      age: 34,
      gender: 'MALE',
      knownConditions: [],
      currentMedications: [],
      isSmoker: false,
      isReviewConsultation: false,
      doctorName: 'Dr. Patel',
      practiceName: 'Sandton Family Practice',
    },
    openingInstruction: `Say exactly: "Hi Sipho, I'm the AI assistant for Sandton Family Practice and Dr. Patel. Everything you share with me is completely private and will only be seen by Dr. Patel. I'm going to ask you a few health questions before your appointment — it should take about 10 to 15 minutes." Then ask warmly: "How are you feeling today? What's going on?"`,
    turns: [
      "I'm not feeling too well. I have a cough.",
      "A bit of both — sometimes dry, sometimes I'm coughing up a bit of phlegm.",
      "It started about 3 days ago.",
      "Yeah I've had a fever. Yesterday night was really bad.",
      "About 2 days with the fever I think.",
      "Yes I've been waking up drenched, had to change my shirt.",
      "The phlegm is yellowish-green.",
      "No blood that I can see.",
      "Yeah I'm a bit breathless when I walk fast.",
      "No, I can lie flat fine. No ankle swelling.",
      "Nobody else at home is coughing. I did visit my cousin last week and he mentioned he's been sick.",
      "No I've never had TB. My cousin, I'm not sure.",
      "No, I've never been tested for HIV.",
      "No allergies. No other medications. I'm generally healthy.",
    ],
  },
  {
    name: 'REVIEW — Diabetic patient, lifestyle assessment',
    patientName: 'Nomsa',
    isReview: true,
    patientContext: {
      age: 58,
      gender: 'FEMALE',
      knownConditions: ['Type 2 Diabetes', 'Hypertension'],
      currentMedications: ['Metformin 850mg BD', 'Amlodipine 5mg OD'],
      isSmoker: false,
      isReviewConsultation: true,
      lastVisitDays: 90,
      doctorName: 'Dr. Mokoena',
      practiceName: 'Soweto Health Centre',
    },
    openingInstruction: `Say exactly: "Hi Nomsa, I'm the AI assistant for Soweto Health Centre and Dr. Mokoena. Everything you share with me is completely private and will only be seen by Dr. Mokoena. I'm going to ask you a few health questions before your appointment — it should take about 10 to 15 minutes. This is a review visit." Then ask: "How have you been since your last visit?"`,
    turns: [
      "I've been okay, a bit tired. My sugar has been up and down.",
      "I check it at home sometimes. Last week it was 14.",
      "I've been taking my tablets mostly, sometimes I forget the lunchtime one.",
      "No side effects that I notice. Just the tiredness.",
      "For breakfast I usually have two slices of white bread with butter and a cup of tea — I take two sugars.",
      "Lunch is normally pap and a stew with some chicken.",
      "Supper is whatever the family has, usually some rice or pap again with meat.",
      "Yes I do have cool drinks sometimes, maybe 2-3 a week.",
      "I walk to the shops and back, maybe 20 minutes. I don't really do formal exercise.",
      "I sit a lot, especially in the evenings watching TV, maybe 5-6 hours.",
      "I don't smoke and I don't drink alcohol.",
      "My last HbA1c was 8.2 about 4 months ago. I don't know my cholesterol.",
      "I had a pap smear about 5 years ago I think. I haven't had a mammogram.",
    ],
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

box('MedAI History-Taking Beta Simulator', C.magenta);
console.log(`${C.grey}Model: claude-opus-4-8 | ${scenarios.length} scenarios | Natural conversational flow test${C.reset}`);

for (const scenario of scenarios) {
  try {
    await runScenario(scenario);
    // pause between scenarios
    await new Promise(r => setTimeout(r, 1000));
  } catch (err) {
    console.error(`\n${C.red}Error in scenario "${scenario.name}":${C.reset}`, err.message);
  }
}

console.log(`\n${C.green}${C.bold}━━━ Beta test complete ━━━${C.reset}\n`);
