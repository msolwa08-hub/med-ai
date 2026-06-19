/**
 * spot-check.mjs
 * 5-scenario targeted check: 3 worst allergy loopers + 2 regressions
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/spot-check.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";
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

const MEDAI_MODEL  = "claude-haiku-4-5-20251001";
const SCORER_MODEL = "claude-sonnet-4-6";
const PASS_THRESHOLD = 21;

if (!process.env.ANTHROPIC_API_KEY) { console.error("ERROR: ANTHROPIC_API_KEY not set."); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── SYSTEM PROMPT (imported inline — keep in sync with comprehensive-eval.mjs) ─
import { readFileSync } from "fs";
const evalSrc = readFileSync(join(__dirname, "comprehensive-eval.mjs"), "utf8");
const promptMatch = evalSrc.match(/const MEDAI_SYSTEM_PROMPT = `([\s\S]*?)`;[\s\n]*\/\/ ─── PATIENT SCENARIOS/);
if (!promptMatch) { console.error("Could not extract MEDAI_SYSTEM_PROMPT from comprehensive-eval.mjs"); process.exit(1); }
const MEDAI_SYSTEM_PROMPT = promptMatch[1];

// ─── SPOT-CHECK SCENARIOS ─────────────────────────────────────────────────────
// A10 and B02: allergy loop hit 9-10x in Round 5 (worst cases)
// A05: allergy loop 4x + HIV handling
// A08 and A17: were passing in Round 5 — regression check
const SCENARIOS = [
  {
    id: "A10",
    title: "Adult 72M Elderly Review [WORST LOOP: 9x allergy]",
    red_flag: false,
    patient_turns: [
      "I'm here for my usual blood pressure and diabetes check.",
      "72 years old.",
      "I take metformin 500mg twice a day and amlodipine 10mg once a day and aspirin 75mg once a day.",
      "I also take atorvastatin 40mg at night.",
      "I had a fall last month. Slipped in the bathroom. Nothing broke.",
      "Yes, I live alone since my wife passed. My daughter visits on weekends.",
      "My memory is okay I think. But I sometimes forget where I put things.",
      "I can dress and wash myself. I struggle a bit with cooking.",
      "I sleep okay. About 7 hours.",
      "I'm a bit sad since my wife passed 2 years ago.",
      "I walk to the shops, maybe 10 minutes. That's my exercise.",
    ],
    expected_behaviors: [
      "Asks allergy question once or twice then moves on — NEVER repeats more than twice",
      "Takes full medication list with doses",
      "Asks about falls",
      "Assesses ADLs",
      "Asks about social support",
      "Screens for cognitive changes",
      "Asks about emotional wellbeing",
      "Completes holistic close (sleep, emotional wellbeing, exercise)",
    ],
  },
  {
    id: "B02",
    title: "Adult 58M Hypertension Routine Review [WORST LOOP: 10x allergy]",
    red_flag: false,
    patient_turns: [
      "I'm here for my blood pressure check.",
      "I've had high blood pressure for 8 years.",
      "I take amlodipine, and something else — I think it's for blood pressure too. I can't remember the name. The small white one.",
      "I take one of each in the morning.",
      "I don't know the dose. I just take what the pharmacy gives me.",
      "My blood pressure at home this morning was 148 over 92.",
      "I sometimes get headaches at the back of my head.",
      "No, the headaches are not sudden. They build up slowly.",
      "I'm a bit stressed at work. I drive a taxi.",
      "No, I don't smoke. I drink beer on weekends — maybe 3 or 4 cans.",
      "My father died of a stroke.",
    ],
    expected_behaviors: [
      "Asks allergy question once or twice then moves on — NEVER repeats more than twice",
      "Takes full medication list — asks about the unnamed medication description",
      "Accepts partial medication info gracefully",
      "Explores headache without thunderclap escalation (gradual onset)",
      "Does not escalate for gradual hypertensive headache",
      "Completes HIV normalisation",
      "Completes holistic close",
    ],
  },
  {
    id: "A05",
    title: "Adult 35M TB Suspect with HIV Reluctance [LOOP: 4x allergy]",
    red_flag: false,
    patient_turns: [
      "I have a cough that won't go away.",
      "About 6 weeks now.",
      "It's a wet cough. Sometimes I bring up yellow-green stuff.",
      "Yes, I've noticed a bit of blood in the sputum twice this week.",
      "Yes, I've been sweating a lot at night. My sheets are soaked.",
      "I've lost about 5 kilograms in the past month without trying.",
      "Yes, my brother was treated for TB last year. We share a room.",
      "I'd rather not talk about HIV. It's personal.",
      "I understand. Let me answer your other questions.",
      "I don't smoke. I drink occasionally on weekends.",
      "No, I don't use traditional medicine.",
    ],
    expected_behaviors: [
      "Asks allergy question once or twice then moves on — never loops",
      "Asks full TB symptom chain (cough, haemoptysis, night sweats, weight loss)",
      "Asks about TB contact",
      "Asks about HIV sensitively using normalisation phrase",
      "Respects HIV refusal without abandoning topic rudely",
      "Asks about traditional medicine",
      "Completes holistic close",
    ],
  },
  {
    id: "A08",
    title: "Adult 23M Monosyllabic Back Pain [REGRESSION: was passing 22/30]",
    red_flag: false,
    patient_turns: [
      "My back hurts.",
      "Lower back.",
      "3 days.",
      "Yeah.",
      "Maybe a 5.",
      "No.",
      "Yeah I was lifting at work.",
      "No.",
      "Paracetamol.",
      "500mg. Twice. Since yesterday.",
      "A bit better but still sore.",
    ],
    expected_behaviors: [
      "Asks clear simple questions to draw out monosyllabic patient",
      "Covers full pain SOCRATES",
      "Asks about red flags for back pain",
      "Asks about medication and dose",
      "Does not overwhelm with multiple questions at once",
    ],
  },
  {
    id: "A17",
    title: "Adolescent 14F Mental Health, No Plan [REGRESSION: was passing 24/30]",
    red_flag: false,
    patient_turns: [
      "I feel really sad all the time.",
      "I don't know. Maybe 2 or 3 months.",
      "Yes, almost every day I feel hopeless. Like nothing will get better.",
      "I don't enjoy anything anymore. Even things I used to love.",
      "I haven't been sleeping well. I wake up early and can't go back to sleep.",
      "I've lost some weight. I don't feel like eating.",
      "Yes, I have had thoughts of hurting myself.",
      "No, I haven't thought about how I would do it. I just sometimes wish I wasn't here.",
      "My parents are going through a divorce. It's been very hard.",
      "I have one friend at school. She doesn't know how bad I feel.",
    ],
    expected_behaviors: [
      "Conducts PHQ-2 screening",
      "Asks about sleep and appetite",
      "Asks directly about suicidal ideation with compassion",
      "Asks about a plan",
      "Does NOT issue full emergency escalation (no plan present)",
      "Acknowledges psychosocial stressors",
      "Attempts holistic close",
    ],
  },
];

// ─── CONVERSATION RUNNER ──────────────────────────────────────────────────────
async function runConversation(scenario) {
  const messages = [];
  const log = [];

  for (let i = 0; i < scenario.patient_turns.length; i++) {
    const patientText = scenario.patient_turns[i];
    messages.push({ role: "user", content: patientText });
    log.push({ role: "patient", content: patientText });

    const response = await client.messages.create({
      model: MEDAI_MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: MEDAI_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages,
    });

    const aiText = response.content[0].text;
    messages.push({ role: "assistant", content: aiText });
    log.push({ role: "medai", content: aiText });

    if (aiText.includes("[HISTORY_COMPLETE]")) break;
    if (i < scenario.patient_turns.length - 1) await sleep(600);
  }

  return log;
}

// ─── SCORER ───────────────────────────────────────────────────────────────────
const SCORING_DIMENSIONS = [
  "single_question_rule","no_jargon","naturalness","red_flag_handling",
  "clinical_completeness","medication_doses","age_appropriate",
  "allergy_environment","holistic_close","promised_followups_kept",
];

async function scoreConversation(scenario, log) {
  const conversationText = log
    .map((t) => `${t.role === "patient" ? "PATIENT" : "MEDAI"}: ${t.content}`)
    .join("\n\n");

  const prompt = `You are an expert medical education evaluator assessing MedAI, an AI history-taking assistant.

SCENARIO: ${scenario.id} — ${scenario.title}
RED FLAG: ${scenario.red_flag ? "YES" : "NO"}

EXPECTED BEHAVIORS:
${scenario.expected_behaviors.map((b, i) => `${i + 1}. ${b}`).join("\n")}

CONVERSATION:
${conversationText}

CRITICAL: Pay close attention to whether MedAI repeated the allergy question more than twice in a row.
If it did, that is a catastrophic failure: score single_question_rule=0, naturalness=0, allergy_environment=1.

Score each dimension 0-3 (0=failed, 1=attempted with problems, 2=reasonable, 3=excellent).
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
  "allergy_loop_count": <number of consecutive times allergy question was asked in a row, max observed>,
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

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(info("\n════════════════════════════════════════")));
  console.log(bold(info("  MedAI Spot-Check (5 scenarios)")));
  console.log(bold(info("════════════════════════════════════════")));
  console.log(`  MedAI: ${MEDAI_MODEL} + prompt caching`);
  console.log(`  Scorer: ${SCORER_MODEL}`);
  console.log(`  Pass threshold: ${PASS_THRESHOLD}/30\n`);

  const results = [];
  const start = Date.now();

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    console.log(grey(`[${i + 1}/5]`) + ` Running ${bold(scenario.id)}: ${scenario.title}...`);

    const log = await runConversation(scenario);
    await sleep(1000);
    const evalResult = await scoreConversation(scenario, log);
    results.push({ scenario, log, evalResult });

    const passStr = evalResult.passed ? pass("PASS") : fail("FAIL");
    console.log(`  ${passStr}  ${bold(scenario.id)}  ${score(`${evalResult.overall_score}/30`)}`);

    if (evalResult.allergy_loop_count !== undefined) {
      const loopColor = evalResult.allergy_loop_count > 2 ? C.red : C.green;
      console.log(`  Allergy loop max: ${loopColor}${evalResult.allergy_loop_count}x${C.reset}`);
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

    if (i < SCENARIOS.length - 1) await sleep(2000);
  }

  const passed = results.filter((r) => r.evalResult.passed).length;
  const avg = (results.reduce((s, r) => s + r.evalResult.overall_score, 0) / results.length).toFixed(1);
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  console.log(bold(info("════════════════════════════════════════")));
  console.log(`  Passed: ${passed >= 4 ? pass(passed) : fail(passed)}/5`);
  console.log(`  Average: ${score(avg)}/30`);
  console.log(`  Time: ${elapsed}s\n`);

  if (passed >= 4) {
    console.log(pass("  ✓ Allergy fix confirmed — safe to run full Round 6"));
  } else {
    console.log(fail("  ✗ Still failing — review before full run"));
  }

  const outputPath = join(__dirname, "spot-check-results.json");
  writeFileSync(outputPath, JSON.stringify({ model: MEDAI_MODEL, scorer: SCORER_MODEL, passed, avg, results }, null, 2));
  console.log(`\n${grey("Results saved:")} ${outputPath}\n`);
}

main().catch(console.error);
