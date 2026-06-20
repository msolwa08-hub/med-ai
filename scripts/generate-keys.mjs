/**
 * Generate MedAI Beta access keys.
 *
 * Usage:
 *   node scripts/generate-keys.mjs <count> [prefix]
 *   node scripts/generate-keys.mjs 5 MEDAI-BETA
 *
 * Add generated keys to apps/api/.env as:
 *   BETA_ACCESS_KEYS=KEY1,KEY2,KEY3
 */

import crypto from 'crypto';

const count = parseInt(process.argv[2] ?? '5', 10);
const prefix = process.argv[3] ?? 'MEDAI-BETA';

if (isNaN(count) || count < 1 || count > 100) {
  console.error('Usage: node generate-keys.mjs <count> [prefix]');
  process.exit(1);
}

const keys = [];
for (let i = 0; i < count; i++) {
  const segment = crypto.randomBytes(4).toString('hex').toUpperCase();
  keys.push(`${prefix}-${segment}`);
}

console.log('\nGenerated access keys:\n');
keys.forEach((k) => console.log(`  ${k}`));
console.log(`\nAdd to apps/api/.env:\n`);
console.log(`BETA_ACCESS_KEYS=${keys.join(',')}\n`);
