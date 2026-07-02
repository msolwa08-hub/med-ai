/**
 * Encrypted-at-rest wrapper for Json columns that carry PHI.
 *
 * DifferentialDiagnosis.diagnoses (and any future clinical Json column) holds
 * health information under POPIA, but Prisma Json columns bypass the field-
 * level encryption used everywhere else. This wrapper stores the ciphertext
 * inside the Json value itself — no migration needed — while reads fall back
 * to plaintext for legacy rows written before encryption was introduced.
 */

import type { Prisma } from '@prisma/client';
import { encryptJSON, decryptJSON } from './encryption.js';

interface EncryptedEnvelope {
  __enc: string;
}

function isEnvelope(v: unknown): v is EncryptedEnvelope {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as Record<string, unknown>).__enc === 'string'
  );
}

/** Encrypt a PHI value for storage in a Prisma Json column. */
export function encryptPhiJson(value: unknown, dataKey: Buffer): Prisma.InputJsonValue {
  return { __enc: encryptJSON(value, dataKey) } as unknown as Prisma.InputJsonValue;
}

/**
 * Decrypt a PHI Json column value. Legacy plaintext rows (written before
 * encryption) are returned as-is so existing data stays readable.
 */
export function decryptPhiJson<T>(stored: unknown, dataKey: Buffer): T {
  if (isEnvelope(stored)) {
    return decryptJSON(stored.__enc, dataKey) as T;
  }
  return stored as T;
}
