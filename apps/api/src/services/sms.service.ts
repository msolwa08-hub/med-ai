import { config } from '../config.js';

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS OTP to a South African phone number.
 * Uses Twilio when credentials are configured, falls back to console log in development.
 */
export async function sendOtpSms(
  to: string,
  otp: string,
  purpose: string
): Promise<SmsResult> {
  const phoneNumber = normalizePhone(to);

  const purposeMessages: Record<string, string> = {
    LOGIN: `Your MedAI login code is: ${otp}. Valid for 10 minutes. Never share this code.`,
    REGISTER: `Welcome to MedAI! Your verification code is: ${otp}. Valid for 10 minutes.`,
    RESET_PASSWORD: `Your MedAI password reset code is: ${otp}. Valid for 10 minutes. If you did not request this, ignore this message.`,
    HPCSA_VERIFY: `Your MedAI HPCSA verification code is: ${otp}. Valid for 10 minutes.`,
  };

  const message = purposeMessages[purpose] ?? `Your MedAI code is: ${otp}. Valid for 10 minutes.`;

  if (
    !config.TWILIO_ACCOUNT_SID ||
    !config.TWILIO_AUTH_TOKEN ||
    !config.TWILIO_PHONE_NUMBER
  ) {
    if (config.NODE_ENV === 'production') {
      console.error('[SMS] TWILIO credentials missing in production — OTP will not be delivered');
      return { success: false, error: 'SMS service not configured' };
    }
    console.log(`[SMS] [DEV] To: ${phoneNumber} | Message: ${message}`);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  try {
    // Dynamically import Twilio only if credentials are present
    const twilio = await import('twilio');
    const client = twilio.default(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: config.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return { success: true, messageId: result.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown SMS error';
    console.error(`[SMS] Failed to send to ${phoneNumber}:`, error);
    return { success: false, error };
  }
}

/**
 * Normalize phone number to E.164 format for South Africa
 * Handles: 0821234567, +27821234567, 27821234567
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit chars except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned; // Already E.164
  }

  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+27${cleaned.slice(1)}`;
  }

  // Default: assume SA number, prepend +27
  return `+27${cleaned}`;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}
