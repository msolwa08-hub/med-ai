/**
 * cockpit-live-test.mjs
 * End-to-end live test of the doctor cockpit's AI pipeline using the EXACT
 * production prompts (SUMMARY_SYSTEM + CLINICAL_PACKAGE_SYSTEM from
 * medai-prompt.ts). Feeds a realistic completed patient history + a doctor's
 * real-style exam notes and prints the generated clinical package.
 *
 * Usage: node scripts/cockpit-live-test.mjs
 * (reads ANTHROPIC_API_KEY from env or apps/api/.env — never printed)
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load API key (never printed) ─────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    const env = readFileSync(join(__dirname, "../apps/api/.env"), "utf8");
    const m = env.match(/ANTHROPIC_API_KEY\s*=\s*(.+)/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^["']|["']$/g, "");
  } catch { /* ignore */ }
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY not set and not found in apps/api/.env");
  process.exit(1);
}

// ── Load the EXACT production prompts ────────────────────────────────────────
const src = readFileSync(join(__dirname, "../apps/api/src/services/medai-prompt.ts"), "utf8");
const SUMMARY_SYSTEM = src.match(/export const SUMMARY_SYSTEM = `([\s\S]*?)`;/)[1];
const CLINICAL_PACKAGE_SYSTEM = src.match(/export const CLINICAL_PACKAGE_SYSTEM = `([\s\S]*?)`;/)[1];

const client = new Anthropic();
const MODEL = "claude-sonnet-4-6";

const C = { r: "\x1b[0m", b: "\x1b[1m", g: "\x1b[32m", y: "\x1b[33m", c: "\x1b[36m", red: "\x1b[31m", grey: "\x1b[90m" };

// ── Realistic completed patient history (MedAI-style, one Q per turn) ─────────
const transcript = `MedAI: Hi, I'm the AI health assistant built specially for Dr. Patel's practice. Whatever you share is private and goes only to Dr. Patel. So tell me — how have you been, and what's brought you in today?
Patient: I've had a bad cough for about five days and now I'm feeling really chesty and short of breath.
MedAI: I'm sorry you're feeling rough. Just before we go further — do you have any allergies to medicines or foods?
Patient: No allergies that I know of.
MedAI: Okay, thanks. Is the cough dry, or are you bringing up phlegm?
Patient: Bringing up phlegm, it's green and a bit thick.
MedAI: Any blood in the phlegm at all?
Patient: No blood.
MedAI: Have you had a fever or felt very hot?
Patient: Yes, I've been feverish, especially at night, sweating quite a bit.
MedAI: Are you short of breath even sitting still, or only when you move around?
Patient: Mostly when I move, like walking to the kitchen.
MedAI: Any chest pain with the breathing or coughing?
Patient: Yes, a sharp pain on the right side when I breathe in deep.
MedAI: Do you smoke at all?
Patient: Yes, about 15 a day, been smoking for 20 years.
MedAI: Do you take any regular medicines?
Patient: No, nothing regular.
MedAI: Any medical conditions you've been diagnosed with before — like asthma, diabetes, high blood pressure?
Patient: No, I've always been fairly healthy.
MedAI: We ask all our patients about HIV at this clinic because it helps us give you the best care — there's no wrong answer. Do you know your HIV status?
Patient: I tested negative last year.
MedAI: Thanks for sharing that. Have you been in contact with anyone who has TB or who's been coughing a lot?
Patient: Not that I know of.
MedAI: Apart from what brought you in today, is there anything ongoing you're living with — a long-term pain, or something you've stopped getting checked?
Patient: Not really, though my chest sometimes feels tight when I climb stairs, even before this.
MedAI: Noted, I'll make sure the doctor knows. Before I pass everything over to the doctor, I just have three quick general questions. How has your sleep been lately?
Patient: Not great the last few nights because of the coughing.
MedAI: And how have you been feeling emotionally — any stress or tough times recently?
Patient: A bit stressed with work but nothing major.
MedAI: Do you manage to get any exercise during the week?
Patient: Not much, I'm quite sedentary.`;

// ── A doctor's real-style examination notes (free text, as jotted on iPad) ────
const examNotes = `O/E: Alert, mildly unwell, not cyanosed.
Vitals: Temp 38.3, HR 98 reg, RR 22, BP 128/82, SpO2 94% on room air.
Resp: Reduced air entry R base, coarse crackles + bronchial breathing RLL, dullness to percussion R base. No wheeze.
CVS: HS I + II + 0, no murmurs, no peripheral oedema.
Abdo: soft, non-tender, no organomegaly.
ENT: throat NAD, no lymphadenopathy.`;

const demographics = "45-year-old male, smoker (15/day x 20 years).";

// ── Helpers ──────────────────────────────────────────────────────────────────
async function generateSummary() {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SUMMARY_SYSTEM,
    messages: [{ role: "user", content: `Produce a concise structured GP Clinical Summary for Dr. Patel from this interview.\n\nTRANSCRIPT:\n${transcript}` }],
  });
  return resp.content[0].type === "text" ? resp.content[0].text : "";
}

async function generatePackage(summary) {
  const userContent = `PATIENT INTERVIEW TRANSCRIPT:\n${transcript}\n\nSTRUCTURED GP SUMMARY:\n${summary}\n\nDOCTOR'S EXAMINATION FINDINGS:\n${examNotes}\n\nKNOWN DEMOGRAPHICS: ${demographics}\n\nProduce the DRAFT clinical package as STRICT JSON per your schema.`;
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 5000,
    temperature: 0,
    system: CLINICAL_PACKAGE_SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });
  const raw = resp.content[0].type === "text" ? resp.content[0].text : "";
  console.log(`${C.grey}(stop_reason=${resp.stop_reason}, output chars=${raw.length})${C.r}`);
  const fenced = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = fenced.indexOf("{"), end = fenced.lastIndexOf("}");
  return JSON.parse(fenced.slice(start, end + 1));
}

function printPackage(p) {
  console.log(`\n${C.b}${C.c}═══ CLINICAL PACKAGE (DRAFT) ═══${C.r}`);
  console.log(`${C.b}Chief complaint:${C.r} ${p.chiefComplaint}\n`);

  console.log(`${C.b}${C.y}DIFFERENTIAL DIAGNOSES${C.r}`);
  for (const d of p.differentials) {
    const bar = "█".repeat(Math.round(d.probability / 5)).padEnd(20, "░");
    console.log(`  ${C.b}${d.diagnosis}${C.r}  ${C.grey}[${d.icd10Code}]${C.r}`);
    console.log(`    ${bar} ${d.probability}% · ${d.band}`);
    if (d.supportingFeatures?.length) console.log(`    ${C.g}For:${C.r} ${d.supportingFeatures.join(", ")}`);
    if (d.againstFeatures?.length) console.log(`    ${C.red}Against:${C.r} ${d.againstFeatures.join(", ")}`);
  }

  console.log(`\n${C.b}${C.y}RECOMMENDED INVESTIGATIONS${C.r}`);
  for (const i of p.recommendedInvestigations) console.log(`  [${i.priority}] ${C.b}${i.name}${C.r} — ${i.rationale}`);

  console.log(`\n${C.b}${C.y}MANAGEMENT PLAN${C.r}`);
  for (const m of p.managementPlan) console.log(`  • ${m}`);

  console.log(`\n${C.b}${C.y}DRAFT PRESCRIPTION${C.r}`);
  if (!p.prescriptionDraft.length) console.log("  (none proposed)");
  for (const rx of p.prescriptionDraft) {
    const sched = rx.scheduled ? `${C.red}⚠ SCHEDULED/HIGHER-RISK${C.r} ` : "";
    console.log(`  ${sched}${C.b}${rx.drug} ${rx.strength}${C.r} ${rx.form} — ${rx.dose} ${rx.route} ${rx.frequency} x ${rx.duration} (qty ${rx.quantity})`);
    if (rx.caution) console.log(`      ${C.grey}caution: ${rx.caution}${C.r}`);
  }

  console.log(`\n${C.b}${C.y}SICK NOTE${C.r}`);
  console.log(`  recommended: ${p.sickNote.recommended ? C.g + "yes" + C.r : "no"}${p.sickNote.recommended ? ` · ${p.sickNote.daysOff} day(s) · "${p.sickNote.natureOfIllness}" · ${p.sickNote.fitnessStatement}` : ""}`);

  if (p.redFlags?.length) {
    console.log(`\n${C.b}${C.red}RED FLAGS${C.r}`);
    for (const r of p.redFlags) console.log(`  ! ${r}`);
  }
  console.log(`\n${C.b}Safety netting:${C.r} ${p.safetyNetting}`);
}

// ── Run ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`${C.grey}Model: ${MODEL} | Using production SUMMARY_SYSTEM + CLINICAL_PACKAGE_SYSTEM${C.r}`);
  console.log(`${C.grey}Case: ${demographics}${C.r}`);
  try {
    console.log(`\n${C.c}1/2 Generating GP summary from history…${C.r}`);
    const summary = await generateSummary();
    console.log(`\n${C.b}═══ GP CLINICAL SUMMARY ═══${C.r}\n${summary}`);

    console.log(`\n${C.c}2/2 Generating clinical package from history + summary + doctor's exam notes…${C.r}`);
    const pkg = await generatePackage(summary);
    printPackage(pkg);
    console.log(`\n${C.g}✓ Live cockpit pipeline test complete.${C.r}`);
  } catch (err) {
    console.error(`\n${C.red}✗ Test failed:${C.r} ${err.message || err}`);
    process.exit(1);
  }
})();
