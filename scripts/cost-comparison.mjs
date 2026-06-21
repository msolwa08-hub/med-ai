/**
 * Cost comparison test — runs one call with each tier and prints token usage.
 * Usage: node scripts/cost-comparison.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../apps/api/.env') });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-6';

const INPUT_COST = { [HAIKU]: 1e-6, [SONNET]: 3e-6 };
const OUTPUT_COST = { [HAIKU]: 5e-6, [SONNET]: 15e-6 };

function cost(model, usage) {
  return (INPUT_COST[model] * usage.input_tokens + OUTPUT_COST[model] * usage.output_tokens).toFixed(6);
}

function printResult(label, model, usage) {
  console.log(`\n  [${label}]`);
  console.log(`    model      : ${model}`);
  console.log(`    input tok  : ${usage.input_tokens}`);
  console.log(`    output tok : ${usage.output_tokens}`);
  console.log(`    cost       : $${cost(model, usage)}`);
}

async function runTest(label, model, system, userMsg, maxTokens = 512) {
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });
  printResult(label, model, res.usage);
  return res;
}

console.log('══════════════════════════════════════════════════════');
console.log('  med-ai cost comparison — Haiku 4.5 vs Sonnet 4.6  ');
console.log('══════════════════════════════════════════════════════');

// ── 1. EML lookup (now on Haiku) ─────────────────────────────────────────────
await runTest(
  'EML lookup  (Haiku)',
  HAIKU,
  'You are a SA pharmacist with expert knowledge of the SA EML. Return ONLY valid JSON — no markdown.',
  'Is amoxicillin 500mg on the SA Essential Medicines List? Reply with JSON: {"isOnEML": bool, "emlCategory": string, "levelOfCare": string, "saContext": string}',
  256,
);

// ── 2. Sick note (now on Haiku) ──────────────────────────────────────────────
await runTest(
  'Sick note   (Haiku)',
  HAIKU,
  'You are a medical documentation assistant for South African healthcare. Generate formal HPCSA-compliant medical certificates. Return ONLY the certificate text.',
  'Generate a sick note: Patient: John Doe, ID 8001015009087, Diagnosis: Acute tonsillitis, Off work 2025-06-18 to 2025-06-20 (3 days), Doctor: Dr A Smith HPCSA MP0012345, Practice: Cape Medical.',
  512,
);

// ── 3. Learning points (stays on Sonnet) ─────────────────────────────────────
await runTest(
  'Learning pts(Sonnet)',
  SONNET,
  'You are a dual-role clinical educator for South African doctors. Generate concise, high-yield clinical learning points. Return ONLY valid JSON.',
  'Generate learning points for: Condition: Community-acquired pneumonia, ICD-10: J18.9, Category: Respiratory',
  1024,
);

// ── 4. STG management plan (stays on Sonnet) ─────────────────────────────────
await runTest(
  'STG plan    (Sonnet)',
  SONNET,
  'You are a senior South African clinician. Provide a personalised management plan following SA Standard Treatment Guidelines. Be concise and flag URGENT actions.',
  'Patient: 45yo male, HIV+ (CD4 280), on ART. Presenting with productive cough x 2 weeks, fever, night sweats. Diagnosed: Community-acquired pneumonia (ICD J18.9). Provide STG-aligned management plan.',
  512,
);

console.log('\n══════════════════════════════════════════════════════');
console.log('  Summary: check [TOKEN_USAGE] lines in API logs      ');
console.log('  to compare before/after totals in production.       ');
console.log('══════════════════════════════════════════════════════\n');
