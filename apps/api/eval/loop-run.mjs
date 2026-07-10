#!/usr/bin/env node
// M1 loop-harness runner. Scores the bedside loop live + reports measured cost.
//   node apps/api/eval/loop-run.mjs --base <url> --key <tools-key>

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAllLoops } from './loop.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const arg = (n, f) => { const i = process.argv.indexOf(`--${n}`); return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : f; };
const base = arg('base', process.env.EVAL_BASE || 'http://localhost:3000').replace(/\/$/, '');
const key = arg('key', process.env.EVAL_KEY || '');
const only = arg('scenario', null);
const dept = arg('dept', null); // e.g. --dept medicine  (score one department's loop set)
if (!key) { console.error('No tools key. --key <key> or EVAL_KEY.'); process.exit(1); }

async function post(path, body) {
  const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tools-key': key }, body: JSON.stringify(body) });
  return res.json().catch(() => null);
}

await post('/tools/usage-stats', { reset: true });
console.log(`\nMedAI LOOP HARNESS — ${base}${dept ? ` · dept=${dept}` : ''}\n`);
const { mean, results } = await runAllLoops(base, key, only, dept);
const usage = await post('/tools/usage-stats', {});

const bar = (n) => `${'█'.repeat(Math.round(n / 5))}${'░'.repeat(20 - Math.round(n / 5))} ${String(n).padStart(5)}`;
for (const r of results) {
  if (r.error) { console.log(`  ${r.id.padEnd(20)} ERROR ${r.error}`); continue; }
  const d = r.detail;
  console.log(`  ${r.id.padEnd(20)} ${bar(r.overall)}`);
  console.log(`     dx=${d.dxPresent} disc=${d.discNamed} mustNotMiss=${d.mustNotMiss} direction=${d.directionOk} narrated=${d.narrated}  (${d.dx}: ${d.before}%→${d.after}%)`);
}
console.log(`\n  LOOP SCORE: ${mean}/100  ${mean >= 90 ? '✓ PASS (≥90)' : '✗ below bar'}`);

const perCall = usage.calls ? usage.estCostUSD / usage.calls : 0;
const perClerking = results.length ? usage.estCostUSD / results.length : 0; // 2 picture calls each
console.log(`  COST: $${usage.estCostUSD.toFixed(4)} over ${usage.calls} calls · $${perCall.toFixed(4)}/call · max single $${usage.maxSingleCallUSD.toFixed(4)} · ~$${perClerking.toFixed(4)}/loop`);
console.log(`  <10c/prompt ceiling: ${usage.maxSingleCallUSD < 0.10 ? 'PASS' : 'FAIL'}\n`);

const dir = join(__dirname, 'reports'); mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const tag = dept ? `${dept}-` : '';
writeFileSync(join(dir, `loop-${tag}${stamp}.json`), JSON.stringify({ mean, results, usage }, null, 2));
console.log(`  report → apps/api/eval/reports/loop-${tag}${stamp}.json\n`);
