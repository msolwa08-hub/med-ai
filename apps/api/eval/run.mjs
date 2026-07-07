#!/usr/bin/env node
// MedAI intern-tools evaluation runner.
//
//   node apps/api/eval/run.mjs --base http://localhost:3000 --key <tools-key>
//   node apps/api/eval/run.mjs --scenario gynae-ectopic
//
// Env: EVAL_BASE, EVAL_KEY, ANTHROPIC_API_KEY (optional — realistic AI-intern),
//      EVAL_MODEL (optional).
//
// Prints a /100 scorecard across four perspectives (speed, clinical quality,
// legibility, reliability) and writes a dated markdown report to eval/reports/.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS, scenarioById } from './scenarios.mjs';
import { runScenario, aggregate } from './harness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const base = arg('base', process.env.EVAL_BASE || 'http://localhost:3000').replace(/\/$/, '');
const key = arg('key', process.env.EVAL_KEY || '');
const only = arg('scenario', null);

if (!key) {
  console.error('No tools key. Pass --key <key> or set EVAL_KEY. (This is the app x-tools-key.)');
  process.exit(1);
}

const scenarios = only ? [scenarioById(only)].filter(Boolean) : SCENARIOS;
if (scenarios.length === 0) {
  console.error(`Unknown scenario "${only}". Known: ${SCENARIOS.map((s) => s.id).join(', ')}`);
  process.exit(1);
}

const bar = (n) => {
  const filled = Math.round(n / 5);
  return `${'█'.repeat(filled)}${'░'.repeat(20 - filled)} ${String(n).padStart(5)}`;
};

console.log(`\nMedAI O&G eval — ${base} — ${scenarios.length} scenario(s)\n`);

const results = [];
for (const s of scenarios) {
  process.stdout.write(`  running ${s.id} … `);
  try {
    const r = await runScenario(s, { base, key });
    results.push(r);
    console.log(`${r.overall}/100`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

if (results.length === 0) { console.error('\nNo results.'); process.exit(1); }

const agg = aggregate(results);

console.log(`\n${'─'.repeat(60)}`);
console.log('SCORECARD (out of 100)');
console.log('─'.repeat(60));
console.log(`  Overall           ${bar(agg.overall)}`);
console.log(`  Speed & ease      ${bar(agg.speed)}   (intern — the aid must be QUICK)`);
console.log(`  Clinical quality  ${bar(agg.quality)}   (consultant)`);
console.log(`  Legibility        ${bar(agg.legibility)}   (human — copy to paper)`);
console.log(`  Reliability       ${bar(agg.reliability)}   (system)`);
console.log('─'.repeat(60));
console.log(`  AI-intern: ${agg.usedAI ? 'on (realistic)' : 'OFF — set ANTHROPIC_API_KEY for realistic answers'}\n`);

// Per-scenario speed reality check: faster than writing it by hand?
console.log('  Time vs writing it by hand:');
for (const r of results) {
  const verdict = r.metrics.wallSec < r.metrics.handwriteSec ? 'faster' : 'SLOWER ⚠';
  console.log(`   ${r.id.padEnd(26)} app ${String(r.metrics.wallSec).padStart(6)}s vs paper ${String(r.metrics.handwriteSec).padStart(6)}s  ${verdict}  (${r.metrics.turns} turns, ${r.metrics.internChars} chars typed)`);
}
console.log('');

// Markdown report
const lines = [];
lines.push(`# MedAI O&G eval report`);
lines.push('');
lines.push(`Base: \`${base}\` · scenarios: ${results.length} · AI-intern: ${agg.usedAI ? 'on' : 'off'}`);
lines.push('');
lines.push('## Aggregate (out of 100)');
lines.push('');
lines.push('| Perspective | Score |');
lines.push('|---|---:|');
lines.push(`| **Overall** | **${agg.overall}** |`);
lines.push(`| Speed & ease (intern) | ${agg.speed} |`);
lines.push(`| Clinical quality (consultant) | ${agg.quality} |`);
lines.push(`| Legibility (human) | ${agg.legibility} |`);
lines.push(`| Reliability (system) | ${agg.reliability} |`);
lines.push('');
lines.push('## Per scenario');
lines.push('');
lines.push('| Scenario | Overall | Speed | Quality | Legibility | Turns | Chars | App s | Paper s |');
lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const r of results) {
  const p = r.perspectives;
  lines.push(`| ${r.title} | ${r.overall} | ${p.speed.score} | ${p.quality.score} | ${p.legibility.score} | ${r.metrics.turns} | ${r.metrics.internChars} | ${r.metrics.wallSec} | ${r.metrics.handwriteSec} |`);
}
lines.push('');
lines.push('## Notes');
lines.push('- Speed is weighted 40% — the app is an aid; if it is not faster than writing by hand it fails.');
lines.push('- Legibility is hard-capped at 40 if any markdown reaches a copy-to-paper output.');
lines.push('- Full per-call detail in the JSON dump alongside this file.');
for (const r of results) {
  if (r.failures.length) lines.push(`- ⚠ ${r.id} failures: ${r.failures.join(', ')}`);
}

const reportsDir = join(__dirname, 'reports');
mkdirSync(reportsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
writeFileSync(join(reportsDir, `report-${stamp}.md`), lines.join('\n'));
writeFileSync(join(reportsDir, `report-${stamp}.json`), JSON.stringify({ agg, results }, null, 2));
console.log(`  report → apps/api/eval/reports/report-${stamp}.md\n`);
