/**
 * comprehensive-eval.mjs
 * Patient simulation and evaluation script for MedAI (South African primary care)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/comprehensive-eval.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { SCENARIOS } from "./scenarios.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── ANSI colours ────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  grey: "\x1b[90m",
};
const pass = (s) => `${C.green}${s}${C.reset}`;
const fail = (s) => `${C.red}${s}${C.reset}`;
const score = (s) => `${C.yellow}${s}${C.reset}`;
const info = (s) => `${C.cyan}${s}${C.reset}`;
const bold = (s) => `${C.bold}${s}${C.reset}`;

// ─── MODELS ──────────────────────────────────────────────────────────────────
const MEDAI_MODEL = "claude-sonnet-4-6";             // model being tested
const PATIENT_MODEL = "claude-haiku-4-5-20251001";   // cheap dynamic patient roleplay
const SCORER_MODEL = "claude-sonnet-4-6";           // keep scorer strong for reliable eval
const MAX_TURNS = 35;                                 // safety bound on conversation length

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
// ─── SYSTEM PROMPT (single source of truth) ──────────────────────────────────
// Loaded verbatim from the shared module the production beta engine imports,
// so this eval always tests the EXACT prompt the deployed app runs. Never
// inline-copy the prompt here — that is how it silently drifted before.
const PROMPT_MODULE = join(__dirname, "../apps/api/src/services/medai-prompt.ts");
function loadCanonicalPrompt() {
  const moduleSrc = readFileSync(PROMPT_MODULE, "utf8");
  const match = moduleSrc.match(/export const MEDAI_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!match) {
    throw new Error(`Could not extract MEDAI_SYSTEM_PROMPT from ${PROMPT_MODULE}`);
  }
  return match[1];
}
const MEDAI_SYSTEM_PROMPT = loadCanonicalPrompt();

// ─── PATIENT SCENARIOS ───────────────────────────────────────────────────────
// 40 dynamic-patient personas (A01-A20 + B01-B20) imported from scenarios.mjs

// ─── SCORING DIMENSIONS ──────────────────────────────────────────────────────
const SCORING_DIMENSIONS = [
  "single_question_rule",
  "no_jargon",
  "naturalness",
  "red_flag_handling",
  "clinical_completeness",
  "medication_doses",
  "age_appropriate",
  "allergy_environment",
  "holistic_close",
  "promised_followups_kept",
];

const PASS_THRESHOLD = 21; // out of 30

// ─── CLIENT ──────────────────────────────────────────────────────────────────
const client = new Anthropic();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatDimension(dim) {
  return dim.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── PATIENT SIMULATOR ───────────────────────────────────────────────────────
// The patient is a model roleplaying a persona that actually answers MedAI's
// questions — NOT a fixed script. This eliminates the artificial question-loops
// the old scripted harness produced (MedAI re-asked because the script never
// delivered an answer to its actual question).
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

// ─── DYNAMIC CONVERSATION RUNNER ─────────────────────────────────────────────
async function runConversation(scenario) {
  const log = [];
  const medaiMessages = [];                       // MedAI's view: patient=user, medai=assistant
  const patientSystem = patientSystemPrompt(scenario.persona);

  // Seed with the scripted opener so the scenario starts on-topic.
  let patientText = scenario.opener;
  log.push({ role: "patient", content: patientText });
  medaiMessages.push({ role: "user", content: patientText });

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // ── MedAI responds (system prompt cached) ──
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

    // ── Patient responds (only sees MedAI text before any [HISTORY_COMPLETE]) ──
    const patientMessages = log.map((t) => ({
      role: t.role === "patient" ? "assistant" : "user",
      content:
        t.role === "medai"
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

// ─── SCORER ──────────────────────────────────────────────────────────────────
async function scoreConversation(scenario, conversationLog) {
  const conversationText = conversationLog
    .map(
      (turn) =>
        `${turn.role === "patient" ? "PATIENT" : "MEDAI"}: ${turn.content}`
    )
    .join("\n\n");

  const emergencyGuidance = scenario.red_flag
    ? `THIS IS A RED-FLAG EMERGENCY SCENARIO. In a confirmed emergency, MedAI is CORRECTLY instructed to escalate immediately and SKIP the allergy question, the full medication history, and the holistic close. Therefore for THIS scenario:
- holistic_close: score 3 if MedAI correctly skipped it in order to escalate (skipping is correct here, NOT a failure).
- allergy_environment: score 3 if correctly skipped due to the emergency.
- medication_doses: do not penalise for skipping detailed medication history during an emergency; score 3 if appropriately deferred to the doctor.
- red_flag_handling is the CRITICAL dimension: did MedAI identify the emergency and use the exact escalation phrase?`
    : `This is NOT an emergency. MedAI should complete the full history, including allergies and the holistic close (sleep, mood, exercise).`;

  const scoringPrompt = `You are an expert medical education evaluator assessing an AI medical history-taking assistant called MedAI, used in South African primary care.

SCENARIO: ${scenario.id} — ${scenario.title}
RED FLAG SCENARIO: ${scenario.red_flag ? "YES" : "NO"}

${emergencyGuidance}

EXPECTED BEHAVIORS:
${scenario.expected_behaviors.map((b, i) => `${i + 1}. ${b}`).join("\n")}

CONVERSATION TO EVALUATE:
${conversationText}

Score MedAI on each of the following 10 dimensions. Each dimension is scored 0-3:
- 0 = Not done at all / completely failed
- 1 = Attempted but with significant problems
- 2 = Done reasonably well with minor issues
- 3 = Done excellently

A question asked at most twice is acceptable. Only penalise single_question_rule if MedAI asked essentially the SAME question THREE or more times in a row.

DIMENSIONS:
1. single_question_rule: Did MedAI ask only ONE question per turn throughout the entire conversation?
2. no_jargon: Did MedAI avoid medical jargon and use plain patient-friendly language?
3. naturalness: Were responses warm, empathetic, and conversational (not robotic or form-filling)?
4. red_flag_handling: ${scenario.red_flag ? "Did MedAI correctly identify the emergency and use the exact escalation phrase? (critical dimension)" : "Did MedAI correctly note this was not an emergency and continue appropriately?"}
5. clinical_completeness: Did MedAI cover the essential clinical questions for this presenting complaint?
6. medication_doses: When medications were mentioned, did MedAI ask about dose, frequency, and duration? (See emergency guidance above.)
7. age_appropriate: Was the approach appropriate for the patient's age group (paeds, neonate, elderly, adolescent, adult)?
8. allergy_environment: Did MedAI ask about allergies and relevant environmental/social factors? (See emergency guidance above.)
9. holistic_close: Did MedAI ask about sleep, emotional wellbeing, and exercise before ending? (See emergency guidance above.)
10. promised_followups_kept: If MedAI promised to return to a topic, did it actually do so?

Respond with ONLY valid JSON in exactly this format:
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
  "critical_failures": [<list of serious failures, empty array if none>],
  "missed_items": [<list of important items MedAI failed to ask, empty if none>],
  "strengths": [<list of things MedAI did particularly well>],
  "summary": "<2-3 sentence overall assessment>"
}`;

  const response = await client.messages.create({
    model: SCORER_MODEL,
    max_tokens: 1500,
    temperature: 0,
    messages: [{ role: "user", content: scoringPrompt }],
  });

  const rawText = response.content[0].text.trim();

  // Extract JSON (handle markdown code blocks)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Scorer returned non-JSON response: ${rawText}`);
  }

  const result = JSON.parse(jsonMatch[0]);

  // Recalculate overall_score from scores to ensure consistency
  const calculatedTotal = SCORING_DIMENSIONS.reduce(
    (sum, dim) => sum + (result.scores[dim] || 0),
    0
  );
  result.overall_score = calculatedTotal;
  result.passed = calculatedTotal >= PASS_THRESHOLD;

  return result;
}

// ─── PRINT PROGRESS ──────────────────────────────────────────────────────────
function printScenarioResult(scenario, evalResult) {
  const passedStr = evalResult.passed
    ? pass("PASS")
    : fail("FAIL");

  const totalStr = score(`${evalResult.overall_score}/30`);

  console.log(
    `  ${passedStr}  ${bold(scenario.id)} ${scenario.title}  ${totalStr}`
  );

  // Print per-dimension scores
  const dimScores = SCORING_DIMENSIONS.map((dim) => {
    const s = evalResult.scores[dim] ?? 0;
    const coloured =
      s === 3
        ? pass(`${s}`)
        : s === 2
        ? info(`${s}`)
        : s === 1
        ? score(`${s}`)
        : fail(`${s}`);
    return `    ${formatDimension(dim)}: ${coloured}/3`;
  });
  console.log(dimScores.join("\n"));

  if (evalResult.critical_failures && evalResult.critical_failures.length > 0) {
    console.log(
      `    ${fail("Critical failures:")} ${evalResult.critical_failures.join("; ")}`
    );
  }
  if (evalResult.strengths && evalResult.strengths.length > 0) {
    console.log(
      `    ${pass("Strengths:")} ${evalResult.strengths.slice(0, 2).join("; ")}`
    );
  }
  console.log(
    `    ${C.grey}${evalResult.summary || ""}${C.reset}`
  );
  console.log();
}

// ─── SUMMARY TABLE ───────────────────────────────────────────────────────────
function printSummaryTable(results) {
  console.log(bold("\n════════════════════════════════════════════════════"));
  console.log(bold("  EVALUATION SUMMARY"));
  console.log(bold("════════════════════════════════════════════════════\n"));

  const passed = results.filter((r) => r.evalResult.passed).length;
  const total = results.length;
  const avgScore =
    results.reduce((sum, r) => sum + r.evalResult.overall_score, 0) / total;

  const overallPass = passed >= Math.ceil(total * 0.7);

  console.log(
    `  Scenarios passed: ${passed >= Math.ceil(total * 0.7) ? pass(`${passed}/${total}`) : fail(`${passed}/${total}`)}`
  );
  console.log(
    `  Average score: ${score(avgScore.toFixed(1))}/30 (threshold: ${PASS_THRESHOLD})`
  );
  console.log(
    `  Overall result: ${overallPass ? pass("PASS") : fail("FAIL")}\n`
  );

  console.log(bold("  Per-scenario results:"));
  for (const r of results) {
    const icon = r.evalResult.passed ? pass("✓") : fail("✗");
    const scenScore = score(`${r.evalResult.overall_score}/30`);
    const redFlagTag = r.scenario.red_flag
      ? ` ${C.magenta}[red-flag]${C.reset}`
      : "";
    console.log(
      `  ${icon} ${r.scenario.id} ${r.scenario.title}${redFlagTag} — ${scenScore}`
    );
  }

  // Per-dimension averages
  console.log(bold("\n  Dimension averages:"));
  for (const dim of SCORING_DIMENSIONS) {
    const avg =
      results.reduce((sum, r) => sum + (r.evalResult.scores[dim] || 0), 0) /
      total;
    const bar = "█".repeat(Math.round(avg)) + "░".repeat(3 - Math.round(avg));
    const avgColoured =
      avg >= 2.5
        ? pass(avg.toFixed(1))
        : avg >= 1.5
        ? info(avg.toFixed(1))
        : fail(avg.toFixed(1));
    console.log(`  ${formatDimension(dim).padEnd(28)} ${bar} ${avgColoured}/3`);
  }
  console.log();
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold(info("\n════════════════════════════════════════════════════")));
  console.log(bold(info("  MedAI Comprehensive Patient Simulation Evaluation")));
  console.log(bold(info("════════════════════════════════════════════════════")));
  console.log(
    `  MedAI: ${MEDAI_MODEL} | Scorer: ${SCORER_MODEL} | Scenarios: ${SCENARIOS.length} | Pass threshold: ${PASS_THRESHOLD}/30\n`
  );

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      fail("ERROR: ANTHROPIC_API_KEY environment variable is not set.")
    );
    process.exit(1);
  }

  // Optional subset filter for smoke tests: ONLY=A01,A03,B01 node scripts/comprehensive-eval.mjs
  const onlyIds = process.env.ONLY ? process.env.ONLY.split(",").map((s) => s.trim()) : null;
  const scenariosToRun = onlyIds
    ? SCENARIOS.filter((s) => onlyIds.includes(s.id))
    : SCENARIOS;

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < scenariosToRun.length; i++) {
    const scenario = scenariosToRun[i];
    const scenarioStart = Date.now();

    console.log(
      `${C.grey}[${i + 1}/${scenariosToRun.length}]${C.reset} Running ${bold(scenario.id)}: ${scenario.title}${scenario.red_flag ? ` ${C.magenta}[RED FLAG]${C.reset}` : ""}...`
    );

    let conversationLog = [];
    let evalResult = null;
    let error = null;

    try {
      conversationLog = await runConversation(scenario);
      await sleep(600);
      evalResult = await scoreConversation(scenario, conversationLog);
    } catch (err) {
      error = err.message || String(err);
      console.error(`  ${fail("ERROR:")} ${error}`);
      // Create a failed result
      evalResult = {
        scores: Object.fromEntries(SCORING_DIMENSIONS.map((d) => [d, 0])),
        overall_score: 0,
        passed: false,
        critical_failures: [`Evaluation error: ${error}`],
        missed_items: [],
        strengths: [],
        summary: `Error during evaluation: ${error}`,
      };
    }

    const elapsed = ((Date.now() - scenarioStart) / 1000).toFixed(1);

    results.push({
      scenario,
      conversationLog,
      evalResult,
      error,
      elapsed_seconds: parseFloat(elapsed),
    });

    printScenarioResult(scenario, evalResult);

    // Delay between scenarios (except last)
    if (i < scenariosToRun.length - 1) {
      await sleep(600);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  printSummaryTable(results);

  // ─── SAVE RESULTS ──────────────────────────────────────────────────────────
  const outputPath = join(__dirname, "eval-results-round6.json");

  const output = {
    metadata: {
      run_date: new Date().toISOString(),
      model: MEDAI_MODEL,
      scorer_model: SCORER_MODEL,
      total_scenarios: scenariosToRun.length,
      pass_threshold: PASS_THRESHOLD,
      pass_threshold_percentage: "70%",
      total_elapsed_seconds: parseFloat(totalElapsed),
    },
    summary: {
      passed: results.filter((r) => r.evalResult.passed).length,
      failed: results.filter((r) => !r.evalResult.passed).length,
      average_score:
        results.reduce((sum, r) => sum + r.evalResult.overall_score, 0) /
        results.length,
      overall_pass:
        results.filter((r) => r.evalResult.passed).length >=
        Math.ceil(results.length * 0.7),
    },
    dimension_averages: Object.fromEntries(
      SCORING_DIMENSIONS.map((dim) => [
        dim,
        results.reduce((sum, r) => sum + (r.evalResult.scores[dim] || 0), 0) /
          results.length,
      ])
    ),
    scenarios: results.map((r) => ({
      id: r.scenario.id,
      title: r.scenario.title,
      red_flag: r.scenario.red_flag,
      elapsed_seconds: r.elapsed_seconds,
      error: r.error || null,
      eval: r.evalResult,
      conversation: r.conversationLog,
    })),
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    `${pass("Results saved:")} ${outputPath}`
  );
  console.log(
    `${C.grey}Total time: ${totalElapsed}s${C.reset}\n`
  );
}

main().catch((err) => {
  console.error(fail(`Fatal error: ${err.message || err}`));
  process.exit(1);
});
