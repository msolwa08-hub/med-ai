#!/usr/bin/env node
// MedAI O&G stress-test runner — overwhelmed-intern abuse across the O&G range.
//
//   node apps/api/eval/stress-run.mjs --base <url> --key <tools-key>
//   node apps/api/eval/stress-run.mjs --scenario gynae-ectopic --mode contradiction
//
// Env: EVAL_BASE, EVAL_KEY, ANTHROPIC_API_KEY (realistic intern), EVAL_MODEL.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, scenarioById } from './scenarios.mjs';
import { stressScenario, aggregate, MODES } from './stress.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : f; };

const base = arg('base', process.env.EVAL_BASE || 'http://localhost:3000').replace(/\/$/, '');
const key = arg('key', process.env.EVAL_KEY || '');
const only = arg('scenario', null);
const mode = arg('mode', null);

if (!key) { console.error('No tools key. Pass --key <key> or set EVAL_KEY.'); process.exit(1); }

const scenarios = only ? only.split(',').map((id) => scenarioById(id.trim())).filter(Boolean) : SCENARIOS;
if (!scenarios.length) { console.error(`Unknown scenario "${only}". Known: ${SCENARIOS.map((s) => s.id).join(', ')}`); process.exit(1); }
const modes = mode ? mode.split(',').map((m) => m.trim()) : MODES;

const bar = (n) => n == null ? '   n/a' : `${'█'.repeat(Math.round(n / 5))}${'░'.repeat(20 - Math.round(n / 5))} ${String(n).padStart(5)}`;

console.log(`\nMedAI O&G STRESS TEST — ${base}`);
console.log(`scenarios: ${scenarios.length} · mistake modes: ${modes.join(', ')}\n`);

const results = [];
for (const s of scenarios) {
  process.stdout.write(`  ${s.id.padEnd(28)} `);
  try {
    const r = await stressScenario(s, { base, key, modes });
    results.push(r);
    console.log(`overall ${String(r.overall).padStart(5)}  (access ${r.accessible} · reason ${r.sophisticated} · discrep ${r.discrepancy ?? 'n/a'})`);
  } catch (e) { console.log(`ERROR ${e.message}`); }
}
if (!results.length) { console.error('\nNo results.'); process.exit(1); }

const agg = aggregate(results);
console.log(`\n${'─'.repeat(64)}`);
console.log('STRESS SCORECARD (out of 100) — overwhelmed intern, full O&G range');
console.log('─'.repeat(64));
console.log(`  Overall                ${bar(agg.overall)}`);
console.log(`  Accessible (intern)    ${bar(agg.accessible)}   easy + hand-holding under pressure`);
console.log(`  Sophisticated (consultant) ${bar(agg.sophisticated)}   dangerous-first dx, Ix→plan, the "why"`);
console.log(`  Discrepancy alarm      ${bar(agg.discrepancy)}   caught the intern's mistake?`);
console.log('─'.repeat(64));
console.log(`  AI-intern: ${agg.usedAI ? 'on (realistic)' : 'OFF — set ANTHROPIC_API_KEY'}\n`);

// Breakdown by mistake mode
console.log('  By mistake mode (overall /100):');
for (const m of modes) {
  const runs = results.flatMap((r) => r.runs.filter((x) => x.mode === m));
  if (!runs.length) continue;
  const mean = (sel) => Math.round((runs.reduce((a, x) => a + (sel(x) ?? 0), 0) / runs.length) * 10) / 10;
  const disc = runs.filter((x) => x.discrepancy !== null);
  const caught = disc.filter((x) => x.detail.discrepancyCaught).length;
  const dtxt = disc.length ? `  discrepancy caught ${caught}/${disc.length}` : '';
  console.log(`   ${m.padEnd(14)} ${String(mean((x) => x.overall)).padStart(5)}${dtxt}`);
}
console.log('');

// Report
const lines = [`# MedAI O&G stress-test report`, '', `Base: \`${base}\` · scenarios: ${results.length} · modes: ${modes.join(', ')} · AI-intern: ${agg.usedAI ? 'on' : 'off'}`, ''];
lines.push('## Aggregate (out of 100)', '', '| Axis | Score |', '|---|---:|',
  `| **Overall** | **${agg.overall}** |`,
  `| Accessible (intern) | ${agg.accessible} |`,
  `| Sophisticated (consultant) | ${agg.sophisticated} |`,
  `| Discrepancy alarm | ${agg.discrepancy ?? 'n/a'} |`, '');
lines.push('## Per scenario', '', '| Scenario | Setting | Overall | Access | Reason | Discrep |', '|---|---|---:|---:|---:|---:|');
for (const r of results) lines.push(`| ${r.title} | ${r.setting} | ${r.overall} | ${r.accessible} | ${r.sophisticated} | ${r.discrepancy ?? 'n/a'} |`);
lines.push('', '## Discrepancy detection (the alarm)', '');
const allDisc = results.flatMap((r) => r.runs).filter((x) => x.discrepancy !== null);
const caughtN = allDisc.filter((x) => x.detail.discrepancyCaught).length;
lines.push(`Injected mistakes the app **should** have flagged: ${allDisc.length}. Caught: **${caughtN}**.`, '');
for (const r of results) for (const run of r.runs.filter((x) => x.discrepancy !== null)) {
  lines.push(`- ${r.id} [${run.mode}]: ${run.detail.discrepancyCaught ? '✓ caught' : '✗ MISSED'} — ${run.detail.discrepancyNote}`);
}

const dir = join(__dirname, 'reports'); mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
writeFileSync(join(dir, `stress-${stamp}.md`), lines.join('\n'));
writeFileSync(join(dir, `stress-${stamp}.json`), JSON.stringify({ agg, results }, null, 2));
console.log(`  report → apps/api/eval/reports/stress-${stamp}.md\n`);
