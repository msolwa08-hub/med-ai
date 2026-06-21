/**
 * PII de-identification at the AI-provider boundary (POPIA data minimisation).
 *
 * Patient health data is "special personal information" under POPIA and every
 * call to the model is a cross-border transfer. We minimise what leaves the
 * server with two complementary strategies:
 *
 *  1. REVERSIBLE TOKEN SUBSTITUTION — for structured identifiers we control
 *     (patient name, ID number, medical-aid number printed on generated
 *     documents). The model only ever sees a placeholder; the real value is
 *     substituted back into the model's output locally, so the identifier
 *     never crosses the network boundary.
 *
 *  2. IRREVERSIBLE REDACTION — for free text the patient types into the
 *     history conversation, where they may volunteer an ID number, phone or
 *     email. The stored transcript keeps the original (the doctor sees full
 *     fidelity); only the copy sent to the model is scrubbed.
 *
 * NOTE: this is the technical data-minimisation layer only. Full POPIA
 * compliance also requires a signed operator agreement (DPA), Zero Data
 * Retention on the provider, informed patient consent for cross-border
 * processing, and the usual governance — none of which live in code.
 */

/** Placeholder tokens — double-bracketed so they cannot collide with clinical text. */
export const PII_TOKENS = {
  name: '[[PATIENT_NAME]]',
  firstName: '[[PATIENT_FIRST_NAME]]',
  idNumber: '[[PATIENT_ID]]',
  medicalAid: '[[MEDICAL_AID_NO]]',
  dateOfBirth: '[[PATIENT_DOB]]',
} as const;

// ─── Free-text redaction patterns ─────────────────────────────────────────────
// Ordered most-specific first. We deliberately do NOT redact short numbers,
// dates, or measurements (e.g. "120/80", "5.6", "3 days") — those carry
// clinical meaning and are not identifying on their own.

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// South African ID: 13 digits, optionally grouped as YYMMDD SSSS CAZ.
const SA_ID_RE = /\b\d{6}[\s-]?\d{4}[\s-]?\d{3}\b/g;
// SA phone: +27 or 0 followed by 9 more digits, with optional spaces/dashes.
const PHONE_RE = /(?:\+?27|0)(?:[\s-]?\d){9}\b/g;
// Other long numeric identifiers (medical-aid / member / passport numbers).
const LONG_NUM_RE = /\b\d{9,12}\b/g;

/**
 * Irreversibly redact identifying tokens from free text before it is sent to
 * the model. Returns a scrubbed copy; the input is never mutated.
 */
export function redactFreeText(text: string): string {
  if (!text) return text;
  return text
    .replace(EMAIL_RE, '[REDACTED_EMAIL]')
    .replace(SA_ID_RE, '[REDACTED_ID]')
    .replace(PHONE_RE, '[REDACTED_PHONE]')
    .replace(LONG_NUM_RE, '[REDACTED_NUMBER]');
}

/**
 * Substitute placeholder tokens in model output back to their real values.
 * Used after generating documents so the true identifiers are re-attached
 * locally, having never been sent to the provider.
 */
export function restorePII(text: string, replacements: Record<string, string | undefined>): string {
  let out = text;
  for (const [token, value] of Object.entries(replacements)) {
    if (value === undefined) continue;
    out = out.split(token).join(value);
  }
  return out;
}

/** First name only — used to keep greetings warm without sending the surname. */
export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}
