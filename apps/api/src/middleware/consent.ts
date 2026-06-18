import type { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { auditLog } from '../services/audit.service.js';

/**
 * Middleware: verify that the requesting doctor has active patient consent
 * before accessing their medical records.
 *
 * Expects:
 *   - request.user (set by authenticate)
 *   - route param: consultationId or patientId
 */
export async function requireConsent(
  request: FastifyRequest<{
    Params: { consultationId?: string; patientId?: string };
    Querystring: { consultationId?: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  const user = request.user;

  if (!user) {
    return reply.status(401).send({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  // Admins bypass consent checks
  if (user.role === 'ADMIN') return;

  // Patients can always access their own data
  if (user.role === 'PATIENT') return;

  // Doctor accessing patient data — enforce consent
  if (user.role !== 'DOCTOR') {
    return reply.status(403).send({ success: false, error: 'Forbidden', code: 'FORBIDDEN' });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.sub },
    select: { id: true, hpcsaStatus: true },
  });

  if (!doctor || doctor.hpcsaStatus !== 'VERIFIED') {
    return reply.status(403).send({
      success: false,
      error: 'HPCSA verification required',
      code: 'HPCSA_NOT_VERIFIED',
    });
  }

  // Resolve the patientId via consultation if needed
  const consultationId =
    (request.params as Record<string, string>).consultationId ??
    (request.query as Record<string, string>).consultationId;

  const patientId = (request.params as Record<string, string>).patientId;

  let resolvedPatientId: string | undefined = patientId;

  if (!resolvedPatientId && consultationId) {
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      select: { patientId: true },
    });
    resolvedPatientId = consultation?.patientId;
  }

  if (!resolvedPatientId) {
    return reply.status(400).send({
      success: false,
      error: 'Cannot determine patient for consent check',
      code: 'CONSENT_UNRESOLVABLE',
    });
  }

  // Check for active consent
  const now = new Date();
  const consent = await prisma.consentRecord.findFirst({
    where: {
      patientId: resolvedPatientId,
      doctorId: doctor.id,
      consentType: 'VIEW_HISTORY',
      granted: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  if (!consent) {
    await auditLog({
      userId: user.sub,
      action: 'CONSENT_DENIED',
      resource: 'Patient',
      resourceId: resolvedPatientId,
      metadata: { doctorId: doctor.id, reason: 'No active consent' },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(403).send({
      success: false,
      error:
        'Patient has not granted you consent to view their medical history. Please request consent first.',
      code: 'CONSENT_REQUIRED',
    });
  }

  // Log the consented access
  await auditLog({
    userId: user.sub,
    action: 'CONSENT_ACCESS',
    resource: 'Patient',
    resourceId: resolvedPatientId,
    metadata: { doctorId: doctor.id, consentId: consent.id },
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  });
}
