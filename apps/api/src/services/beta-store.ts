// Encrypted, write-through persistence for beta sessions.
//
// Sessions are the working set in memory (fast), but every mutation is written
// through to disk encrypted at rest (AES-256-GCM), and the store is hydrated on
// startup — so a restart or redeploy no longer wipes in-flight histories or
// completed consults the doctor hasn't reviewed yet.
//
// This is deliberately a thin, swappable seam: the engine only calls
// persistSession / deleteSession / hydrateSessions. Pointing it at a database
// later means reimplementing just this file. On hosts with an ephemeral disk,
// set BETA_DATA_DIR to a persistent volume for cross-redeploy durability.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { betaConfig } from '../lib/beta-config.js';
import type { BetaSession } from './beta-engine.js';

const ENABLED = betaConfig.BETA_PERSIST !== '0';
const DIR = betaConfig.BETA_DATA_DIR || './.beta-data';

function deriveKey(): Buffer {
  const secret = betaConfig.BETA_DATA_KEY;
  if (!secret && ENABLED) {
    console.warn(
      '[beta] BETA_DATA_KEY is not set — persisted data uses an INSECURE dev key. ' +
        'Set BETA_DATA_KEY (and a persistent BETA_DATA_DIR) in production.',
    );
  }
  return scryptSync(secret || 'medai-beta-insecure-dev-key', 'medai-beta-store-salt', 32);
}
const KEY = deriveKey();

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(b64: string): string {
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function fileFor(sessionId: string): string {
  return join(DIR, `${sessionId}.json`);
}

export function persistSession(session: BetaSession): void {
  if (!ENABLED) return;
  try {
    if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
    writeFileSync(fileFor(session.sessionId), encrypt(JSON.stringify(session)), 'utf8');
  } catch (err) {
    console.warn('[beta] failed to persist session', session.sessionId, err);
  }
}

export function deleteSession(sessionId: string): void {
  if (!ENABLED) return;
  try {
    const p = fileFor(sessionId);
    if (existsSync(p)) unlinkSync(p);
  } catch (err) {
    console.warn('[beta] failed to delete persisted session', sessionId, err);
  }
}

export function hydrateSessions(): BetaSession[] {
  if (!ENABLED || !existsSync(DIR)) return [];
  const out: BetaSession[] = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      out.push(JSON.parse(decrypt(readFileSync(join(DIR, f), 'utf8'))) as BetaSession);
    } catch (err) {
      console.warn('[beta] could not load persisted session', f, err);
    }
  }
  return out;
}
