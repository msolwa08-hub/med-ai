/**
 * spot-check.mjs
 * 5-scenario targeted check with DYNAMIC LLM PATIENTS.
 *
 * Key change: the patient is no longer a fixed script that recites lines in
 * order regardless of what MedAI asks. It is now a second model roleplaying a
 * patient persona that actually answers MedAI's questions. This eliminates the
 * artificial "question loops" that the scripted harness produced (MedAI re-asked
 * because the script never delivered an answer to its actual question).
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/spot-check.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const C = { reset: "\x1b[0m", bold: "\x1b[1m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", grey: "\x1b[90m" };
const pass  = (s) => `${C.green}${s}${C.reset}`;
const fail  = (s) => `${C.red}${s}${C.reset}`;
const score = (s) => `${C.yellow}${s}${C.reset}`;
const info  = (s) => `${C.cyan}${s}${C.reset}`;
const bold  = (s) => `${C.bold}${s}${C.reset}`;
const grey  = (s) => `${C.grey}${s}${C.reset}`;

const MEDAI_MODEL   = "claude-sonnet-4-6";              // model under test
const PATIENT_MODEL = "claude-haiku-4-5-20251001";      // cheap roleplay
const SCORER_MODEL  = "claude-sonnet-4-6";              // reliable evaluation
const PASS_THRESHOLD = 21;
const MAX_TURNS = 22;                                    // safety bound on conversation length

if (!process.env.ANTHROPIC_API_KEY) { console.error("ERROR: ANTHROPIC_API_KEY not set."); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── MEDAI SYSTEM PROMPT (single source of truth: shared medai-prompt.ts) ──────
// Loaded from the exact module the production beta engine imports, so this
// spot-check tests the prompt the deployed app actually runs.
const promptSrc = readFileSync(join(__dirname, "../apps/api/src/services/medai-prompt.ts"), "utf8");
const promptMatch = promptSrc.match(/export const MEDAI_SYSTEM_PROMPT = `([\s\S]*?)`;/);
if (!promptMatch) { console.error("Could not extract MEDAI_SYSTEM_PROMPT from medai-prompt.ts"); process.exit(1); }
const MEDAI_SYSTEM_PROMPT = promptMatch[1];

// ─── PATIENT SIMULATOR ─────────────────────────────────────────────────────────
function patientSystemPrompt(persona) {
  return `You are roleplaying a PATIENT talking to an automated medical history assistant before seeing your doctor. Stay fully in character at all times.

YOUR CHARACTER AND BACKGROUND:
${persona.profile}

YOUR COMMUNICATION STYLE: ${persona.style}

HOW TO RESPOND:
- Answer ONLY the specific question you were just asked. Real patients do not recite their whole history at once.
- Keep replies short and natural — usually one short sentence, occasionally two.
- Reveal a detail from your background ONLY when the assistant asks about that specific thing.
- If asked about a symptom or detail NOT in your background, give a normal plausible answer — for symptoms you don't have, just say no.
- Never volunteer information the assistant hasn't asked about (unless your style explicitly says you're chatty).
- Never break character. Never say you are an AI, a model, or in a simulation. Never give the assistant instructions.
- Use plain everyday language, not medical jargon (unless your character would naturally use it).
- If the assistant signals the conversation is finished or says goodbye, give a brief, polite closing reply.`;
}

// ─── SCENARIOS (persona-based, dynamic patient) ────────────────────────────────
const SCENARIOS = [
  {
    id: "A10",
    title: "Adult 72M Elderly Review [was 9x allergy loop]",
    red_flag: false,
    opener: "Morning. I'm here for my usual blood pressure and diabetes check-up.",
    persona: {
      profile: `You are a 72-year-old man. You have come in for a routine blood pressure and diabetes review — you feel basically okay, no new major complaints.
- Your medicines: metformin 500mg twice a day (taken for about 6 years), amlodipine 10mg once a day, aspirin 75mg once a day, and atorvastatin 40mg at night. You know these fairly well.
- Allergies: none that you know of.
- You had ONE fall last month — slipped in the bathroom, nothing broke, you were not dizzy beforehand.
- You live alone since your wife passed away 2 years ago. Your daughter visits on weekends.
- Your memory is mostly fine but you sometimes forget where you put things.
- You can dress and wash yourself, but you struggle a bit with cooking.
- Sleep is okay, about 7 hours.
- Emotionally you've been a bit sad since your wife died.
- Exercise: you walk to the shops, about 10 minutes, most days.
- You do not smoke. You have an occasional glass of wine.
- No traditional medicines.`,
      style: "Polite, cooperative, slightly chatty older gentleman.",
    },
    expected_behaviors: [
      "Asks the allergy question only once or twice, never loops",
      "Captures the medication list with doses",
      "Asks about the fall and whether there was dizziness",
      "Assesses ADLs (washing, dressing, cooking)",
      "Asks about social support / who he lives with",
      "Screens for memory/cognition",
      "Completes the holistic close (sleep, mood, exercise)",
      "Reaches [HISTORY_COMPLETE] with a clinical summary",
    ],
  },
  {
    id: "B02",
    title: "Adult 58M Hypertension Review [was 10x allergy loop]",
    red_flag: false,
    opener: "Hi, I'm here for my blood pressure check.",
    persona: {
      profile: `You are a 58-year-old man here for a routine blood pressure review.
- You have had high blood pressure for 8 years.
- Medicines: amlodipine (you know that name), plus "another small white one" that you think is also for blood pressure but you genuinely cannot remember its name or the dose. You take one of each in the morning. You don't know the strengths — you just take what the pharmacy gives you.
- Your home blood pressure this morning was 148 over 92.
- You sometimes get headaches at the back of your head. They build up slowly over time — they are NOT sudden, NOT the worst of your life, no vision changes, no neck stiffness.
- Allergies: none.
- You drive a taxi and are a bit stressed at work.
- You don't smoke. You drink 3 or 4 beers on weekends.
- Your father died of a stroke.
- HIV: you don't mind answering — you tested negative last year — but you'll only say so if asked.
- Sleep is broken because of stress. Mood: stressed but coping. Exercise: very little, you sit driving all day.
- No traditional medicines.`,
      style: "Matter-of-fact, straightforward, answers plainly.",
    },
    expected_behaviors: [
      "Asks the allergy question only once, never loops",
      "Takes the medication list and gracefully accepts that he doesn't know the 2nd drug's name/dose, then moves on",
      "Asks about home blood pressure readings",
      "Explores the headache and correctly does NOT escalate (gradual onset, not thunderclap)",
      "Completes HIV normalisation question",
      "Completes the holistic close (sleep, mood, exercise)",
      "Reaches [HISTORY_COMPLETE] with a clinical summary",
    ],
  },
  {
    id: "A05",
    title: "Adult 35M TB Suspect, HIV reluctance [was 4x allergy loop]",
    red_flag: false,
    opener: "I've had a cough that just won't go away.",
    persona: {
      profile: `You are a 35-year-old man with a persistent cough.
- The cough has lasted about 6 weeks. It is a wet cough bringing up yellow-green phlegm. You have seen a little blood in it twice this week.
- You've had drenching night sweats — your sheets get soaked.
- You've lost about 5kg in the last month without trying.
- Your brother was treated for TB last year, and you share a room with him.
- Allergies: none that you know of.
- You take no regular medicines.
- You do NOT smoke. You drink occasionally on weekends.
- You do NOT use traditional medicines.
- HIV: you are RELUCTANT and uncomfortable discussing it. If asked, you say "I'd rather not talk about HIV, it's personal." If the assistant is gentle and respectful and moves on, you appreciate it. You will continue answering all OTHER questions cooperatively. (Privately your status is positive but you will not disclose it today.)`,
      style: "Cooperative and open about physical symptoms, but visibly guarded and uncomfortable when HIV comes up.",
    },
    expected_behaviors: [
      "Asks the allergy question only once, never loops",
      "Covers the TB symptom chain (cough duration, phlegm, blood, night sweats, weight loss)",
      "Asks about TB contact",
      "Introduces HIV sensitively with a normalising phrase BEFORE the patient refuses",
      "Respects the HIV refusal warmly without abandoning rapport or pushing",
      "Asks about traditional medicine",
      "Completes the holistic close",
      "Reaches [HISTORY_COMPLETE] with a clinical summary flagging probable TB",
    ],
  },
  {
    id: "A08",
    title: "Adult 23M Monosyllabic Back Pain [regression check]",
    red_flag: false,
    opener: "My back hurts.",
    persona: {
      profile: `You are a 23-year-old man with lower back pain.
- It started 3 days ago after lifting boxes at work.
- It's in your lower back, a dull ache, about 5 out of 10, no spreading down the legs.
- No numbness, no leg weakness, no problems with bladder or bowels, no fever, no weight loss.
- You took paracetamol 500mg twice since yesterday and it helped a little.
- Allergies: none.
- You don't smoke, occasional drink.
- Sleep, mood, exercise: all normal/fine.`,
      style: "MONOSYLLABIC. You answer in as few words as possible — 'Yeah', 'No', '3 days', 'Lower back'. You never volunteer anything extra. You're not rude, just a man of very few words.",
    },
    expected_behaviors: [
      "Draws out a monosyllabic patient with clear simple questions",
      "Covers the pain history (site, onset, character, severity, what helped)",
      "Screens back-pain red flags (bladder/bowel, leg weakness/numbness)",
      "Captures the paracetamol dose",
      "Asks allergy once, never loops",
      "Reaches a reasonable close",
    ],
  },
  {
    id: "A17",
    title: "Adolescent 14F Mental Health, no plan [regression check]",
    red_flag: false,
    opener: "I've just been feeling really sad all the time.",
    persona: {
      profile: `You are a 14-year-old girl. You came in feeling persistently sad.
- You've felt sad and low for 2 to 3 months.
- Almost every day you feel hopeless, like nothing will get better.
- You've lost interest in things you used to enjoy.
- Your sleep is bad — you wake up early and can't get back to sleep.
- You've lost some weight and don't feel like eating.
- If asked directly and gently about thoughts of hurting yourself: yes, you have had thoughts of hurting yourself.
- If asked whether you have a PLAN or have thought about HOW: no, you have not made any plan or thought about how — you "just sometimes wish you weren't here."
- Your parents are going through a divorce and it's been very hard.
- You have one friend at school who doesn't know how bad you feel.
- Allergies: none. No medicines.`,
      style: "A quiet, somewhat guarded teenager. You don't volunteer the heavy stuff, but if the assistant is warm and asks gently and directly, you do open up and answer honestly.",
    },
    expected_behaviors: [
      "Conducts PHQ-2 style screening (low mood, loss of interest)",
      "Asks about sleep and appetite",
      "Asks directly and compassionately about thoughts of self-harm",
      "Asks about a plan, and correctly does NOT issue full emergency escalation since there's no plan",
      "Acknowledges the psychosocial stressors (divorce, isolation)",
      "Handles a minor sensitively",
    ],
  },
];

// ─── DYNAMIC CONVERSATION RUNNER ───────────────────────────────────────────────
async function runConversation(scenario) {
  const log = [];
  // MedAI's view: patient = user, MedAI = assistant
  const medaiMessages = [];
  // Patient's view: MedAI = user, patient = assistant
  const patientSystem = patientSystemPrompt(scenario.persona);

  // Seed with the scripted opener so the scenario starts on-topic.
  let patientText = scenario.opener;
  log.push({ role: "patient", content: patientText });
  medaiMessages.push({ role: "user", content: patientText });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // ── MedAI responds ──
    const medaiResp = await client.messages.create({
      model: MEDAI_MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: MEDAI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: medaiMessages,
    });
    const medaiText = medaiResp.content[0].text;
    medaiMessages.push({ role: "assistant", content: medaiText });
    log.push({ role: "medai", content: medaiText });

    if (medaiText.includes("[HISTORY_COMPLETE]")) break;

    // ── Patient responds (only sees MedAI text up to here) ──
    const patientMessages = log
      .filter((t) => t.role !== "system")
      .map((t) => ({
        role: t.role === "patient" ? "assistant" : "user",
        content: t.role === "medai"
          ? t.content.replace(/\[HISTORY_COMPLETE\][\s\S]*$/, "").trim()
          : t.content,
      }));

    const patientResp = await client.messages.create({
      model: PATIENT_MODEL,
      max_tokens: 200,
      system: patientSystem,
      messages: patientMessages,
    });
    patientText = patientResp.content[0].text;
    log.push({ role: "patient", content: patientText });
    medaiMessages.push({ role: "user", content: patientText });

    await sleep(300);
  }

  return log;
}

// ─── SCORER (emergency-aware) ──────────────────────────────────────────────────
const SCORING_DIMENSIONS = [
  "single_question_rule","no_jargon","naturalness","red_flag_handling",
  "clinical_completeness","medication_doses","age_appropriate",
  "allergy_environment","holistic_close","promised_followups_kept",
];

async function scoreConversation(scenario, log) {
  const conversationText = log
    .map((t) => `${t.role === "patient" ? "PATIENT" : "MEDAI"}: ${t.content}`)
    .join("\n\n");

  const emergencyGuidance = scenario.red_flag
    ? `THIS IS A RED-FLAG EMERGENCY SCENARIO. In a confirmed emergency, MedAI is CORRECTLY instructed to escalate immediately and SKIP the allergy question, full medication history, and the holistic close. Therefore:
- holistic_close: score 3 if MedAI correctly skipped it to escalate (skipping is correct here, not a failure).
- allergy_environment: score 3 if correctly skipped due to emergency.
- medication_doses: do not penalise for skipping detailed med history during an emergency; score 3 if appropriately deferred.
- red_flag_handling is the CRITICAL dimension: did it identify the emergency and use the exact escalation phrase?`
    : `This is NOT an emergency. MedAI should complete the full history including allergies and the holistic close (sleep, mood, exercise).`;

  const prompt = `You are an expert medical education evaluator assessing MedAI, an AI history-taking assistant for South African primary care.

SCENARIO: ${scenario.id} — ${scenario.title}
RED FLAG: ${scenario.red_flag ? "YES" : "NO"}

${emergencyGuidance}

EXPECTED BEHAVIORS:
${scenario.expected_behaviors.map((b, i) => `${i + 1}. ${b}`).join("\n")}

CONVERSATION TO EVALUATE:
${conversationText}

Score each dimension 0-3 (0=failed, 1=attempted with problems, 2=reasonable, 3=excellent).
A question asked at most twice is fine; only penalise single_question_rule if MedAI asked essentially the SAME question THREE or more times in a row.
Total 0-30. Pass = 21+.

Respond ONLY with valid JSON:
{
  "scores": {
    "single_question_rule": <0-3>,
    "no_jargon": <0-3>,
    "naturalness": <0-3>,
    "red_flag_handling": <0-3>,
    "clinical_completeness": <0-3>,
    "medication_doses": <0-3>,
    "age_appropriate": <0-3>,
    "allergy_environment": <0-3>,
    "holistic_close": <0-3>,
    "promised_followups_kept": <0-3>
  },
  "overall_score": <0-30>,
  "passed": <true|false>,
  "max_same_question_repeats": <highest number of times any single question was asked in a row>,
  "critical_failures": [],
  "strengths": [],
  "summary": "<2-3 sentences>"
}`;

  const response = await client.messages.create({
    model: SCORER_MODEL,
    max_tokens: 1000,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Scorer returned non-JSON: ${raw}`);
  const result = JSON.parse(match[0]);
  const total = SCORING_DIMENSIONS.reduce((s, d) => s + (result.scores[d] || 0), 0);
  result.overall_score = total;
  result.passed = total >= PASS_THRESHOLD;
  return result;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(info("\n════════════════════════════════════════")));
  console.log(bold(info("  MedAI Spot-Check (5 scenarios, DYNAMIC patient)")));
  console.log(bold(info("════════════════════════════════════════")));
  console.log(`  MedAI:   ${MEDAI_MODEL} + prompt caching`);
  console.log(`  Patient: ${PATIENT_MODEL} (roleplay)`);
  console.log(`  Scorer:  ${SCORER_MODEL}`);
  console.log(`  Pass threshold: ${PASS_THRESHOLD}/30\n`);

  const results = [];
  const start = Date.now();

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    console.log(grey(`[${i + 1}/5]`) + ` Running ${bold(scenario.id)}: ${scenario.title}...`);

    const log = await runConversation(scenario);
    await sleep(800);
    const evalResult = await scoreConversation(scenario, log);
    results.push({ scenario: { id: scenario.id, title: scenario.title, red_flag: scenario.red_flag }, log, evalResult });

    const passStr = evalResult.passed ? pass("PASS") : fail("FAIL");
    console.log(`  ${passStr}  ${bold(scenario.id)}  ${score(`${evalResult.overall_score}/30`)}  ${grey(`(${log.filter(l=>l.role==='medai').length} MedAI turns)`)}`);

    if (evalResult.max_same_question_repeats !== undefined) {
      const r = evalResult.max_same_question_repeats;
      const col = r > 2 ? C.red : C.green;
      console.log(`  Max same-question repeats: ${col}${r}${C.reset}`);
    }

    SCORING_DIMENSIONS.forEach((dim) => {
      const s = evalResult.scores[dim];
      const color = s === 3 ? C.green : s === 2 ? C.cyan : s === 1 ? C.yellow : C.red;
      const label = dim.replace(/_/g, " ").padEnd(26);
      console.log(`    ${label} ${color}${s}${C.reset}/3`);
    });

    if (evalResult.critical_failures?.length) {
      evalResult.critical_failures.forEach((f) => console.log(fail(`    ✗ ${f}`)));
    }
    console.log(grey(`  ${evalResult.summary}\n`));

    if (i < SCENARIOS.length - 1) await sleep(1500);
  }

  const passed = results.filter((r) => r.evalResult.passed).length;
  const avg = (results.reduce((s, r) => s + r.evalResult.overall_score, 0) / results.length).toFixed(1);
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  console.log(bold(info("════════════════════════════════════════")));
  console.log(`  Passed: ${passed >= 4 ? pass(passed) : fail(passed)}/5`);
  console.log(`  Average: ${score(avg)}/30`);
  console.log(`  Time: ${elapsed}s\n`);

  if (passed >= 4) {
    console.log(pass("  ✓ Dynamic patient fix confirmed — safe to port to full Round 6"));
  } else {
    console.log(fail("  ✗ Still failing — review transcripts before full run"));
  }

  const outputPath = join(__dirname, "spot-check-results.json");
  writeFileSync(outputPath, JSON.stringify({ medai: MEDAI_MODEL, patient: PATIENT_MODEL, scorer: SCORER_MODEL, passed, avg, results }, null, 2));
  console.log(`\n${grey("Results saved:")} ${outputPath}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
