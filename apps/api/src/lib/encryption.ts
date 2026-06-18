/**
 * AES-256-GCM encryption service for patient medical data
 *
 * Architecture:
 * - Master key (ENCRYPTION_KEY env var) encrypts per-consultation data keys
 * - Each consultation gets a unique 32-byte random data key
 * - Patient fields are encrypted with the consultation data key
 * - Encrypted fields are stored as base64-encoded JSON: {encryptedData, iv, authTag}
 */

import crypto from 'crypto';
import { config } from '../config.js';
import type { EncryptedField } from '../types/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96 bits - recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32;      // 256 bits

/**
 * Get master encryption key from config (hex -> Buffer)
 */
function getMasterKey(): Buffer {
  return Buffer.from(config.ENCRYPTION_KEY, 'hex');
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param plaintext - The plaintext string to encrypt
 * @param dataKey - Optional data key (uses master key if not provided)
 * @returns Encrypted field with iv and authTag
 */
export function encrypt(
  plaintext: string,
  dataKey?: Buffer
): EncryptedField {
  const key = dataKey ?? getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

/**
 * Decrypt an AES-256-GCM encrypted value
 * @param encryptedData - Base64-encoded ciphertext
 * @param iv - Base64-encoded IV
 * @param authTag - Base64-encoded authentication tag
 * @param dataKey - Optional data key (uses master key if not provided)
 * @returns Decrypted plaintext string
 */
export function decrypt(
  encryptedData: string,
  iv: string,
  authTag: string,
  dataKey?: Buffer
): string {
  const key = dataKey ?? getMasterKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH }
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Generate a cryptographically secure random 32-byte data key
 */
export function generateDataKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypt a data key with the master key
 * Returns a base64-encoded JSON string containing the encrypted key
 */
export function encryptDataKey(dataKey: Buffer): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(dataKey), cipher.final()]);

  const result: EncryptedField = {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };

  return Buffer.from(JSON.stringify(result)).toString('base64');
}

/**
 * Decrypt an encrypted data key
 * @param encryptedKey - Base64-encoded JSON EncryptedField
 * @returns Decrypted data key as Buffer
 */
export function decryptDataKey(encryptedKey: string): Buffer {
  const masterKey = getMasterKey();
  const field: EncryptedField = JSON.parse(
    Buffer.from(encryptedKey, 'base64').toString('utf8')
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    masterKey,
    Buffer.from(field.iv, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH }
  );

  decipher.setAuthTag(Buffer.from(field.authTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(field.encryptedData, 'base64')),
    decipher.final(),
  ]);

  return decrypted;
}

/**
 * Encrypt a JSON-serializable object
 * @param obj - Any JSON-serializable value
 * @param dataKey - Optional data key (uses master key if not provided)
 * @returns Base64-encoded JSON string of EncryptedField
 */
export function encryptJSON(obj: unknown, dataKey?: Buffer): string {
  const plaintext = JSON.stringify(obj);
  const encrypted = encrypt(plaintext, dataKey);
  return Buffer.from(JSON.stringify(encrypted)).toString('base64');
}

/**
 * Decrypt an encrypted JSON object
 * @param encryptedStr - Base64-encoded JSON string of EncryptedField
 * @param dataKey - Optional data key (uses master key if not provided)
 * @returns Parsed JSON value
 */
export function decryptJSON(encryptedStr: string, dataKey?: Buffer): unknown {
  const field: EncryptedField = JSON.parse(
    Buffer.from(encryptedStr, 'base64').toString('utf8')
  );
  const plaintext = decrypt(field.encryptedData, field.iv, field.authTag, dataKey);
  return JSON.parse(plaintext);
}

/**
 * Encrypt a plain text field and return a compact storage string
 * Format: base64(JSON({encryptedData, iv, authTag}))
 */
export function encryptField(plaintext: string, dataKey?: Buffer): string {
  const encrypted = encrypt(plaintext, dataKey);
  return Buffer.from(JSON.stringify(encrypted)).toString('base64');
}

/**
 * Decrypt a compact storage string back to plaintext
 */
export function decryptField(encryptedStr: string, dataKey?: Buffer): string {
  const field: EncryptedField = JSON.parse(
    Buffer.from(encryptedStr, 'base64').toString('utf8')
  );
  return decrypt(field.encryptedData, field.iv, field.authTag, dataKey);
}
