import { config } from '../config.js';

export interface HpcsaVerificationResult {
  valid: boolean;
  name?: string;
  specialization?: string;
  status?: string;
  expiryDate?: string;
  error?: string;
}

/**
 * Verify an HPCSA registration number.
 *
 * In production: calls the HPCSA API.
 * In development or when API key is missing: returns a mock result.
 *
 * HPCSA numbers follow the format: board code + registration number
 * e.g., MP 0123456 (Medical Practitioner)
 */
export async function verifyHpcsaNumber(
  hpcsaNumber: string
): Promise<HpcsaVerificationResult> {
  const normalized = hpcsaNumber.trim().toUpperCase();

  // Validate format (letters + numbers, 5-12 chars)
  if (!/^[A-Z]{1,4}\s?\d{4,8}$/.test(normalized)) {
    return {
      valid: false,
      error: 'Invalid HPCSA number format. Expected format: MP 1234567',
    };
  }

  if (config.NODE_ENV === 'production' && !config.HPCSA_API_KEY) {
    throw new Error(
      'HPCSA_API_KEY is required in production. Doctor verification cannot proceed without it.'
    );
  }

  if (!config.HPCSA_API_KEY || config.NODE_ENV === 'development') {
    return mockHpcsaVerification(normalized);
  }

  try {
    const response = await fetch(config.HPCSA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.HPCSA_API_KEY,
      },
      body: JSON.stringify({ registrationNumber: normalized }),
    });

    if (!response.ok) {
      throw new Error(`HPCSA API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      valid: boolean;
      practitioner?: {
        name: string;
        specialization: string;
        registrationStatus: string;
        expiryDate: string;
      };
      error?: string;
    };

    if (!data.valid || !data.practitioner) {
      return { valid: false, error: data.error ?? 'Registration not found' };
    }

    return {
      valid: true,
      name: data.practitioner.name,
      specialization: data.practitioner.specialization,
      status: data.practitioner.registrationStatus,
      expiryDate: data.practitioner.expiryDate,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'HPCSA verification failed';
    console.error('[HPCSA] Verification error:', error);
    return { valid: false, error };
  }
}

/**
 * Mock HPCSA verification for development and testing.
 * Returns verified for most numbers, rejected for numbers starting with "INVALID".
 */
function mockHpcsaVerification(hpcsaNumber: string): HpcsaVerificationResult {
  if (hpcsaNumber.includes('INVALID') || hpcsaNumber.startsWith('BAD')) {
    return { valid: false, error: 'Registration number not found in HPCSA database' };
  }

  // Derive mock data from the number
  const boardCodes: Record<string, string> = {
    MP: 'Medical Practitioner',
    DN: 'Dentist',
    NR: 'Nurse',
    PT: 'Physiotherapist',
    PH: 'Pharmacist',
    OP: 'Optometrist',
    OT: 'Occupational Therapist',
    DT: 'Dietitian',
    PS: 'Psychologist',
    SO: 'Sonographer',
  };

  const prefix = hpcsaNumber.replace(/\s/g, '').replace(/\d+/, '');
  const specialization = boardCodes[prefix] ?? 'General Practitioner';

  return {
    valid: true,
    name: 'Dr. [Verified via Mock]',
    specialization,
    status: 'ACTIVE',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };
}

/**
 * Parse HPCSA number to determine board type
 */
export function getHpcsaBoardType(hpcsaNumber: string): string {
  const prefix = hpcsaNumber.trim().toUpperCase().replace(/\s/g, '').replace(/\d+/, '');
  const boards: Record<string, string> = {
    MP: 'Medical and Dental Board',
    DN: 'Medical and Dental Board',
    PT: 'Allied Health Professions Board',
    OT: 'Allied Health Professions Board',
    DT: 'Allied Health Professions Board',
    NR: 'South African Nursing Council',
    PH: 'South African Pharmacy Council',
  };
  return boards[prefix] ?? 'Health Professions Council of South Africa';
}
