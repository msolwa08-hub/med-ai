/**
 * Async session store — the single source of truth for beta sessions.
 *
 * Two interchangeable backends, chosen at load time from the environment:
 *
 *   • Vercel KV (Upstash Redis) — used when KV_REST_API_URL + KV_REST_API_TOKEN
 *     are set (i.e. on Vercel with KV enabled). Sessions survive cold starts,
 *     redeploys, and concurrent serverless instances. This is what makes a
 *     full-Vercel deploy correct: serverless functions don't share memory, so
 *     in-flight chats MUST live in an external store.
 *
 *   • Memory + encrypted disk — the original behaviour, used everywhere KV is
 *     not configured (local dev, the standalone Render/Docker server). Fast
 *     in-process Map, write-through to disk via beta-store.ts.
 *
 * The engine only ever calls loadSession / saveSession / removeSession /
 * loadAllSessions, so swapping persistence later means touching only this file.
 */

import {
  persistSession as diskPersist,
  deleteSession as diskDelete,
  hydrateSessions as diskHydrate,
} from './beta-store.js';
import type { BetaSession } from './beta-engine.js';

export const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours (sliding window)

const USE_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ─────────────────────────────────────────────────────────────────────────────
// Vercel KV backend
// ─────────────────────────────────────────────────────────────────────────────

const KEY_PREFIX = 'beta:session:';
const INDEX_KEY = 'beta:sessions'; // a Redis set of all live session ids

// Minimal surface of the @vercel/kv client we use. Declared locally so this
// file typechecks even when @vercel/kv isn't installed (the package is only
// pulled in at runtime on Vercel, via the dynamic import below).
interface KvClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  sadd(key: string, member: string): Promise<unknown>;
  srem(key: string, member: string): Promise<unknown>;
  smembers(key: string): Promise<string[]>;
}

// Lazily imported so the standalone server never pulls in @vercel/kv.
let kvClient: KvClient | null = null;
async function kv(): Promise<KvClient> {
  if (!kvClient) {
    const mod = (await import('@vercel/kv' as string)) as { kv: KvClient };
    kvClient = mod.kv;
  }
  return kvClient;
}

const ttlSeconds = Math.floor(SESSION_TTL_MS / 1000);

async function kvLoad(id: string): Promise<BetaSession | null> {
  const client = await kv();
  const session = await client.get<BetaSession>(KEY_PREFIX + id);
  if (!session) {
    // Expired or gone — drop the dangling index entry.
    await client.srem(INDEX_KEY, id).catch(() => {});
    return null;
  }
  return session;
}

async function kvSave(session: BetaSession): Promise<void> {
  const client = await kv();
  await client.set(KEY_PREFIX + session.sessionId, session, { ex: ttlSeconds });
  await client.sadd(INDEX_KEY, session.sessionId);
}

async function kvRemove(id: string): Promise<void> {
  const client = await kv();
  await client.del(KEY_PREFIX + id);
  await client.srem(INDEX_KEY, id);
}

async function kvLoadAll(): Promise<BetaSession[]> {
  const client = await kv();
  const ids = await client.smembers(INDEX_KEY);
  if (!ids.length) return [];
  const values = await Promise.all(ids.map((id) => client.get<BetaSession>(KEY_PREFIX + id)));
  const out: BetaSession[] = [];
  const stale: string[] = [];
  ids.forEach((id, i) => {
    const v = values[i];
    if (v) out.push(v);
    else stale.push(id);
  });
  if (stale.length) await Promise.all(stale.map((id) => client.srem(INDEX_KEY, id).catch(() => {})));
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory + disk backend (default)
// ─────────────────────────────────────────────────────────────────────────────

const mem = new Map<string, BetaSession>();
let hydrated = false;

function hydrateOnce(): void {
  if (hydrated) return;
  hydrated = true;
  const now = Date.now();
  for (const s of diskHydrate()) {
    if (now - s.lastActivityAt > SESSION_TTL_MS) {
      diskDelete(s.sessionId);
    } else {
      mem.set(s.sessionId, s);
    }
  }
}

function memLoad(id: string): BetaSession | null {
  hydrateOnce();
  const s = mem.get(id);
  if (!s) return null;
  if (Date.now() - s.lastActivityAt > SESSION_TTL_MS) {
    mem.delete(id);
    diskDelete(id);
    return null;
  }
  return s;
}

function memSave(session: BetaSession): void {
  hydrateOnce();
  mem.set(session.sessionId, session);
  diskPersist(session);
}

function memRemove(id: string): void {
  hydrateOnce();
  mem.delete(id);
  diskDelete(id);
}

function memLoadAll(): BetaSession[] {
  hydrateOnce();
  const now = Date.now();
  const out: BetaSession[] = [];
  for (const [id, s] of mem) {
    if (now - s.lastActivityAt > SESSION_TTL_MS) {
      mem.delete(id);
      diskDelete(id);
    } else {
      out.push(s);
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public async API
// ─────────────────────────────────────────────────────────────────────────────

export async function loadSession(id: string): Promise<BetaSession | null> {
  return USE_KV ? kvLoad(id) : memLoad(id);
}

export async function saveSession(session: BetaSession): Promise<void> {
  if (USE_KV) await kvSave(session);
  else memSave(session);
}

export async function removeSession(id: string): Promise<void> {
  if (USE_KV) await kvRemove(id);
  else memRemove(id);
}

export async function loadAllSessions(): Promise<BetaSession[]> {
  return USE_KV ? kvLoadAll() : memLoadAll();
}

export function storeBackend(): 'kv' | 'memory' {
  return USE_KV ? 'kv' : 'memory';
}
