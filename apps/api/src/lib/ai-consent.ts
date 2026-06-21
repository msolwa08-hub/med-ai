/**
 * POPIA lawful-basis gate for cross-border AI processing of patient health data.
 *
 * Sending health data ("special personal information", POPIA s26-27) to the
 * model is a cross-border transfer (s72). The lawful basis we rely on is the
 * patient's explicit DATA_PROCESSING consent. This module verifies that a
 * granted, non-expired consent exists before any AI processing runs.
 *
 * Enforcement is gated by config.ENFORCE_AI_PROCESSING_CONSENT so the control
 * can be shipped and tested before patient onboarding captures the consent.
 * Either way, the absence of consent is written to the audit trail.
 */

import prisma from './prisma.js';
import { config } from '../config.js';
import { auditLog } from '../services/audit.service.js';

export async function hasAiProcessingConsent(patientId: string): Promise<boolean> {
  const now = new Date();
  const consent = await prisma.consentRecord.findFirst({
    where: {
      patientId,
      consentType: 'DATA_PROCESSING',
      granted: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return consent !== null;
}

interface ConsentCheckCtx {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Returns { ok: true } if AI processing may proceed. When consent is missing,
 * the gap is always audited; the call is blocked only when enforcement is on.
 */
export async function checkAiProcessingConsent(
  patientId: string,
  ctx: ConsentCheckCtx
): Promise<{ ok: boolean }> {
  if (await hasAiProcessingConsent(patientId)) return { ok: true };

  const enforced = config.ENFORCE_AI_PROCESSING_CONSENT;
  await auditLog({
    userId: ctx.userId,
    action: enforced ? 'AI_PROCESSING_CONSENT_DENIED' : 'AI_PROCESSING_CONSENT_MISSING',
    resource: 'Patient',
    resourceId: patientId,
    metadata: { reason: 'No active DATA_PROCESSING consent', enforced },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { ok: !enforced };
}

export const AI_CONSENT_ERROR = {
  success: false as const,
  error:
    'The patient has not granted consent for AI processing of their health data ' +
    '(cross-border). Please capture DATA_PROCESSING consent before starting.',
  code: 'AI_PROCESSING_CONSENT_REQUIRED' as const,
};
