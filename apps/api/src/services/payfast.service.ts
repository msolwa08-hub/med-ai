import crypto from 'crypto';
import { config } from '../config.js';

// PayFast sandbox: https://sandbox.payfast.co.za/eng/process
// PayFast production: https://www.payfast.co.za/eng/process
const PAYFAST_HOST =
  config.NODE_ENV === 'production'
    ? 'https://www.payfast.co.za'
    : 'https://sandbox.payfast.co.za';

const PAYFAST_VALIDATE_URL =
  config.NODE_ENV === 'production'
    ? 'https://www.payfast.co.za/eng/query/validate'
    : 'https://sandbox.payfast.co.za/eng/query/validate';

// Ordered key list as required by PayFast's signature algorithm
const PARAM_ORDER: ReadonlyArray<string> = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_str1',
];

export interface PayFastParams {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;   // our internal payment ID
  amount: string;          // formatted as "150.00"
  item_name: string;
  item_description?: string;
  custom_str1?: string;    // we use this for consultationId
}

/**
 * Build the ordered param string PayFast requires, compute an HMAC-MD5
 * signature, and return the full payment URL.
 */
export function generatePayFastUrl(params: PayFastParams): string {
  // Build ordered pairs, filtering empty values
  const pairs: string[] = [];
  for (const key of PARAM_ORDER) {
    const value = params[key as keyof PayFastParams];
    if (value !== undefined && value !== null && value !== '') {
      pairs.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  let paramString = pairs.join('&');

  // Append passphrase for signature computation
  const passphrase = config.PAYFAST_PASSPHRASE ?? '';
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  const signature = crypto.createHash('md5').update(paramString).digest('hex');

  // Return URL without the passphrase (only signature is appended to the URL)
  const baseParamString = pairs.join('&');
  return `${PAYFAST_HOST}/eng/process?${baseParamString}&signature=${signature}`;
}

/**
 * Verify an ITN (Instant Transaction Notification) from PayFast.
 *
 * Steps:
 * 1. Verify payment_status === 'COMPLETE' (or caller checks separately)
 * 2. Recreate the signature from the body (excluding the signature field)
 * 3. Optionally confirm with PayFast's validator endpoint
 */
export async function verifyPayFastITN(
  body: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  try {
    // Step 1: Recreate signature
    const params: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      if (key === 'signature') continue;
      params.push(`${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`);
    }

    let paramString = params.join('&');
    const passphrase = config.PAYFAST_PASSPHRASE ?? '';
    if (passphrase) {
      paramString += `&passphrase=${encodeURIComponent(passphrase)}`;
    }

    const expectedSignature = crypto
      .createHash('md5')
      .update(paramString)
      .digest('hex');

    if (body.signature !== expectedSignature) {
      return false;
    }

    // Step 2: Validate with PayFast's validator (best-effort; don't block on failure)
    try {
      const validationResponse = await fetch(PAYFAST_VALIDATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: rawBody,
        signal: AbortSignal.timeout(5000),
      });
      const validationText = await validationResponse.text();
      if (validationText !== 'VALID') {
        return false;
      }
    } catch {
      // If the validator is unreachable, fall back to signature-only check
      // (acceptable for sandbox / development environments)
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate the 85/15 doctor/platform fee split.
 * Both values are rounded to 2 decimal places.
 */
export function calculateSplit(totalAmount: number): {
  doctor: number;
  platform: number;
} {
  const doctor = Math.round(totalAmount * 0.85 * 100) / 100;
  const platform = Math.round(totalAmount * 0.15 * 100) / 100;
  return { doctor, platform };
}
