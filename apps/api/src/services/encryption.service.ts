/**
 * High-level encryption service for patient data
 * Wraps the low-level encryption lib with consultation-scoped data keys
 */

import {
  encryptField,
  decryptField,
  encryptJSON,
  decryptJSON,
  generateDataKey,
  encryptDataKey,
  decryptDataKey,
} from '../lib/encryption.js';

export { generateDataKey, encryptDataKey, decryptDataKey };

/**
 * Encrypt a text field using a consultation's data key
 */
export function encryptPatientField(
  value: string,
  encryptedDataKey: string
): string {
  const dataKey = decryptDataKey(encryptedDataKey);
  return encryptField(value, dataKey);
}

/**
 * Decrypt a text field using a consultation's data key
 */
export function decryptPatientField(
  encryptedValue: string,
  encryptedDataKey: string
): string {
  const dataKey = decryptDataKey(encryptedDataKey);
  return decryptField(encryptedValue, dataKey);
}

/**
 * Encrypt a JSON value using a consultation's data key
 */
export function encryptPatientJSON(
  value: unknown,
  encryptedDataKey: string
): string {
  const dataKey = decryptDataKey(encryptedDataKey);
  return encryptJSON(value, dataKey);
}

/**
 * Decrypt a JSON value using a consultation's data key
 */
export function decryptPatientJSON(
  encryptedValue: string,
  encryptedDataKey: string
): unknown {
  const dataKey = decryptDataKey(encryptedDataKey);
  return decryptJSON(encryptedValue, dataKey);
}

/**
 * Encrypt PII fields for Patient model (uses master key directly)
 * These fields are encrypted independently from consultation data keys
 */
export function encryptPII(value: string): string {
  return encryptField(value);
}

export function decryptPII(encryptedValue: string): string {
  return decryptField(encryptedValue);
}

export function encryptPIIJSON(value: unknown): string {
  return encryptJSON(value);
}

export function decryptPIIJSON(encryptedValue: string): unknown {
  return decryptJSON(encryptedValue);
}

/**
 * Create a new data key for a consultation (returns the encrypted key for storage)
 */
export function createConsultationDataKey(): {
  dataKey: Buffer;
  encryptedDataKey: string;
} {
  const dataKey = generateDataKey();
  const encryptedDataKey = encryptDataKey(dataKey);
  return { dataKey, encryptedDataKey };
}
