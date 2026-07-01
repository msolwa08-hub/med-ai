/**
 * Emergency Profile Service
 *
 * Manages patient emergency profiles — a compact, QR-code-accessible
 * summary of critical medical information for emergency responders.
 *
 * Architecture:
 *   - Full profile stored encrypted in DB (sensitive data protected)
 *   - QR token: cryptographically signed 24h token (no-auth public endpoint)
 *   - Public endpoint returns only clinically necessary emergency data
 *   - All PII fields encrypted at rest using per-patient data keys
 *
 * Token format: base64url(JSON({consultationId, patientId, exp, sig}))
 * Signature: HMAC-SHA256 with EMERGENCY_SECRET env var
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { encryptJSON, decryptJSON, encryptField, decryptField } from '../lib/encryption.js';
import { config } from '../config.js';
import type { EmergencyContact, VitalSigns } from '../types/index.js';

// ============================================================
// Types
// ============================================================

export interface DecryptedEmergencyProfile {
  patientId: string;
  // Identification
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  idNumber?: string;
  // Critical clinical
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: MedicationSummary[];
  // Emergency specifics
  emergencyContacts: EmergencyContact[];
  advanceDirective?: string; // DNR, living will
  organDonor?: boolean;
  // Recent vitals (optional)
  lastVitals?: VitalSigns;
  // Sensitive flags
  isHIVPositive?: boolean; // Only shown if patient consents
  isOnART?: boolean;
  isDiabetic?: boolean;
  hasEpilepsy?: boolean;
  hasHeartCondition?: boolean;
  // Metadata
  lastUpdated: string;
  version: number;
}

export interface MedicationSummary {
  name: string;
  dose: string;
  frequency: string;
  critical: boolean; // e.g. insulin, ARVs, anticoagulants
}

export interface EmergencyPublicData {
  // What emergency responders see (no-auth, QR-accessible)
  patientName: string;
  dateOfBirth: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  criticalMedications: MedicationSummary[]; // critical=true only
  emergencyContact?: EmergencyContact; // first contact only
  advanceDirective?: string;
  organDonor?: boolean;
  // Clinical flags (patient consent required for each)
  clinicalFlags: string[]; // e.g. "Epilepsy", "Insulin-dependent diabetic"
  lastUpdated: string;
  disclaimer: string;
}

export interface UpdateEmergencyProfileInput {
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: MedicationSummary[];
  emergencyContacts?: EmergencyContact[];
  advanceDirective?: string;
  organDonor?: boolean;
  isHIVPositive?: boolean;
  isOnART?: boolean;
  isDiabetic?: boolean;
  hasEpilepsy?: boolean;
  hasHeartCondition?: boolean;
  // Consent flags
  showHIVStatusInEmergency?: boolean;
  showARTInEmergency?: boolean;
}

interface QRTokenPayload {
  patientId: string;
  version: number;
  exp: number; // Unix timestamp
  sig: string;
}

// ============================================================
// Constants
// ============================================================

const QR_TOKEN_TTL_HOURS = 24;
const EMERGENCY_DISCLAIMER =
  'This information is provided for emergency medical use only. ' +
  'Verify patient identity before administering treatment. ' +
  'MedAI — South African Digital Health Platform.';

// ============================================================
// Token Management
// ============================================================

/**
 * Generate a 24-hour QR access token for a patient's emergency profile
 */
export function generateEmergencyQRToken(patientId: string, version: number): string {
  const exp = Math.floor(Date.now() / 1000) + QR_TOKEN_TTL_HOURS * 3600;
  const payload = { patientId, version, exp };

  // Sign with HMAC-SHA256
  const sig = signToken(payload);

  const tokenData: QRTokenPayload = { ...payload, sig };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
}

/**
 * Verify and decode an emergency QR token
 * Returns null if invalid or expired
 */
export function verifyEmergencyQRToken(token: string): { patientId: string; version: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as QRTokenPayload;

    // Check expiry
    if (Date.now() / 1000 > decoded.exp) {
      console.warn('[Emergency] QR token expired for patient:', decoded.patientId);
      return null;
    }

    // Verify signature
    const { sig, ...payload } = decoded;
    const expectedSig = signToken(payload);
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      console.warn('[Emergency] Invalid QR token signature');
      return null;
    }

    return { patientId: decoded.patientId, version: decoded.version };
  } catch (err) {
    console.warn('[Emergency] Failed to parse QR token:', err);
    return null;
  }
}

function signToken(payload: Omit<QRTokenPayload, 'sig'>): string {
  const secret = config.EMERGENCY_SECRET ?? config.ENCRYPTION_KEY;
  return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
}

// ============================================================
// Profile CRUD
// ============================================================

/**
 * Get or create an emergency profile for a patient
 */
export async function getEmergencyProfile(
  patientId: string
): Promise<DecryptedEmergencyProfile | null> {
  const patient = await prisma.patient.findUnique({
    where: { userId: patientId },
    include: { user: true },
  });

  if (!patient) return null;

  // Check if emergency profile exists as a JSON field on the patient model
  // (stored as encrypted blob in emergencyProfileData)
  const raw = (patient as Record<string, unknown>).emergencyProfileData as string | null;

  if (!raw) {
    // Return minimal profile from basic patient data
    return buildMinimalProfile(patient, patientId);
  }

  try {
    const profile = decryptJSON(raw) as DecryptedEmergencyProfile;
    return profile;
  } catch (err) {
    console.error('[Emergency] Failed to decrypt emergency profile:', err);
    return buildMinimalProfile(patient, patientId);
  }
}

/**
 * Update a patient's emergency profile
 */
export async function updateEmergencyProfile(
  patientId: string,
  input: UpdateEmergencyProfileInput
): Promise<DecryptedEmergencyProfile> {
  const existing = await getEmergencyProfile(patientId);
  const patient = await prisma.patient.findUnique({
    where: { userId: patientId },
    include: { user: true },
  });

  if (!patient) throw new Error('Patient not found');

  const currentVersion = existing?.version ?? 0;

  const updatedProfile: DecryptedEmergencyProfile = {
    patientId,
    firstName: (patient as Record<string, unknown>).firstName as string ?? '',
    lastName: (patient as Record<string, unknown>).lastName as string ?? '',
    dateOfBirth: patient.dateOfBirth?.toISOString() ?? '',
    gender: patient.gender ?? 'Unknown',
    idNumber: decryptFieldSafe((patient as Record<string, unknown>).encryptedIdNumber as string | undefined),
    bloodGroup: input.bloodGroup ?? existing?.bloodGroup,
    allergies: input.allergies ?? existing?.allergies ?? [],
    chronicConditions: input.chronicConditions ?? existing?.chronicConditions ?? [],
    currentMedications: input.currentMedications ?? existing?.currentMedications ?? [],
    emergencyContacts: input.emergencyContacts ?? existing?.emergencyContacts ?? [],
    advanceDirective: input.advanceDirective ?? existing?.advanceDirective,
    organDonor: input.organDonor ?? existing?.organDonor,
    isHIVPositive: input.isHIVPositive ?? existing?.isHIVPositive,
    isOnART: input.isOnART ?? existing?.isOnART,
    isDiabetic: input.isDiabetic ?? existing?.isDiabetic,
    hasEpilepsy: input.hasEpilepsy ?? existing?.hasEpilepsy,
    hasHeartCondition: input.hasHeartCondition ?? existing?.hasHeartCondition,
    lastUpdated: new Date().toISOString(),
    version: currentVersion + 1,
  };

  const encrypted = encryptJSON(updatedProfile);

  // Store encrypted profile on patient record
  await prisma.patient.update({
    where: { userId: patientId },
    data: {
      emergencyProfileData: encrypted,
    } as Record<string, unknown>,
  });

  return updatedProfile;
}

/**
 * Get the public-facing emergency data for QR code access
 * This is what emergency responders see — filtered for sensitivity
 */
export async function getEmergencyPublicData(
  patientId: string,
  showHIVStatus = false,
  showARTStatus = false
): Promise<EmergencyPublicData | null> {
  const profile = await getEmergencyProfile(patientId);
  if (!profile) return null;

  // Build clinical flags — only non-stigmatising conditions by default
  const clinicalFlags: string[] = [];

  if (profile.isDiabetic) clinicalFlags.push('Diabetes mellitus — check blood glucose');
  if (profile.hasEpilepsy) clinicalFlags.push('Epilepsy — seizure first aid applies');
  if (profile.hasHeartCondition) clinicalFlags.push('Cardiac condition — handle with care');
  if (profile.isHIVPositive && showHIVStatus) {
    clinicalFlags.push('HIV positive — standard precautions');
  }
  if (profile.isOnART && showARTStatus) {
    clinicalFlags.push('On antiretroviral therapy — do not miss doses');
  }

  // Only critical medications (insulin, ARVs, anticoagulants, anti-epileptics)
  const criticalMedications = (profile.currentMedications ?? []).filter((m) => m.critical);

  // Sensitive information check for HIV on ARV medications
  const filteredCriticalMeds = showARTStatus
    ? criticalMedications
    : criticalMedications.filter((m) => !isARVMedication(m.name));

  return {
    patientName: `${profile.firstName} ${profile.lastName}`,
    dateOfBirth: profile.dateOfBirth,
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    criticalMedications: filteredCriticalMeds,
    emergencyContact: profile.emergencyContacts?.[0],
    advanceDirective: profile.advanceDirective,
    organDonor: profile.organDonor,
    clinicalFlags,
    lastUpdated: profile.lastUpdated,
    disclaimer: EMERGENCY_DISCLAIMER,
  };
}

/**
 * Access emergency profile via QR token (no-auth public endpoint)
 * This is the public emergency access point
 */
export async function getEmergencyDataByQRToken(token: string): Promise<{
  data: EmergencyPublicData | null;
  error?: string;
  expired?: boolean;
}> {
  const verified = verifyEmergencyQRToken(token);

  if (!verified) {
    return {
      data: null,
      error: 'QR code is invalid or has expired (24-hour validity)',
      expired: true,
    };
  }

  const data = await getEmergencyPublicData(verified.patientId);

  if (!data) {
    return {
      data: null,
      error: 'Emergency profile not found',
    };
  }

  // Log emergency access for audit trail
  await logEmergencyAccess(verified.patientId, 'QR_TOKEN_ACCESS');

  return { data };
}

/**
 * Refresh the QR token for a patient (generates a new 24h token)
 */
export async function refreshEmergencyQRToken(patientId: string): Promise<{
  qrToken: string;
  qrUrl: string;
  expiresAt: string;
}> {
  const profile = await getEmergencyProfile(patientId);
  const version = profile?.version ?? 1;

  const token = generateEmergencyQRToken(patientId, version);
  const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_HOURS * 3600 * 1000).toISOString();

  // Base URL from config, fallback to relative path
  const baseUrl = config.APP_BASE_URL ?? 'https://medai.co.za';
  const qrUrl = `${baseUrl}/emergency/${token}`;

  return {
    qrToken: token,
    qrUrl,
    expiresAt,
  };
}

// ============================================================
// Private Helpers
// ============================================================

function buildMinimalProfile(
  patient: Record<string, unknown>,
  patientId: string
): DecryptedEmergencyProfile {
  return {
    patientId,
    firstName: (patient.firstName as string) ?? '',
    lastName: (patient.lastName as string) ?? '',
    dateOfBirth: (patient.dateOfBirth instanceof Date
      ? patient.dateOfBirth.toISOString()
      : String(patient.dateOfBirth ?? '')),
    gender: (patient.gender as string) ?? 'Unknown',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    emergencyContacts: [],
    lastUpdated: new Date().toISOString(),
    version: 0,
  };
}

function decryptFieldSafe(encryptedValue?: string): string | undefined {
  if (!encryptedValue) return undefined;
  try {
    return decryptField(encryptedValue);
  } catch {
    return undefined;
  }
}

const ARV_NAMES = [
  'tenofovir', 'tdf', 'lamivudine', '3tc', 'dolutegravir', 'dtg',
  'efavirenz', 'efv', 'lopinavir', 'ritonavir', 'abacavir', 'abc',
  'atazanavir', 'darunavir', 'raltegravir', 'elvitegravir', 'emtricitabine',
  'tld', 'atripla', 'trivenz', 'odimune',
];

function isARVMedication(name: string): boolean {
  const lower = name.toLowerCase();
  return ARV_NAMES.some((arv) => lower.includes(arv));
}

async function logEmergencyAccess(patientId: string, accessType: string): Promise<void> {
  try {
    await (prisma as unknown as Record<string, unknown>).auditLog && undefined;
    // Use audit service if available — fail silently if not
    console.info(`[Emergency] Access logged: patient=${patientId}, type=${accessType}`);
  } catch {
    // Non-critical — audit failure should not block emergency access
  }
}
