/**
 * Durable persistence for the beta server — deliberately independent of the
 * full API's config stack (config.ts hard-validates JWT/encryption env vars
 * at import time, which the beta image must not require).
 *
 * Degradation contract: when DATABASE_URL is unset, or Prisma fails to
 * initialise, every caller receives `null` and the in-memory stores behave
 * exactly as they always have (client transcript replay + localStorage
 * remain the fallback persistence). A configured database upgrades the
 * server to durable state; a missing one never breaks it.
 */
import { PrismaClient } from '@prisma/client';

let client: PrismaClient | null = null;
let disabled = false;

export function betaDb(): PrismaClient | null {
  if (disabled || !process.env.DATABASE_URL) return null;
  if (!client) {
    try {
      client = new PrismaClient({ log: ['error'], errorFormat: 'minimal' });
    } catch (err) {
      console.error(
        '[beta-db] Prisma init failed — continuing memory-only:',
        err instanceof Error ? err.message : err
      );
      disabled = true;
      return null;
    }
  }
  return client;
}

export function betaDbEnabled(): boolean {
  return !disabled && !!process.env.DATABASE_URL;
}
