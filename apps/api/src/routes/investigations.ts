import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { encryptJSON, decryptJSON, decryptDataKey } from '../lib/encryption.js';

// ============================================================
// Schemas
// ============================================================

const CreateInvestigationSchema = z.object({
  consultationId: z.string().min(1),
  type: z.enum(['LAB', 'RADIOLOGY', 'OTHER']),
  name: z.string().min(1).max(200),
  urgency: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
  specialInstructions: z.string().max(2000).optional(),
});

const AddResultSchema = z.object({
  result: z.string().min(1).max(10000),
  resultDate: z.string().optional(), // ISO date string
});

// ============================================================
// Route plugin
// ============================================================

export async function investigationRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /investigations
  // ----------------------------------------------------------
  fastify.post(
    '/investigations',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const parsed = CreateInvestigationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, type, name, urgency, specialInstructions } = parsed.data;
      const doctorUserId = request.user!.sub;

      // Verify doctor identity
      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      // Verify consultation exists and doctor has access
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { id: true, doctorId: true, encryptedDataKey: true },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      if (consultation.doctorId !== doctor.id) {
        return reply.status(403).send({
          success: false,
          error: 'You are not the assigned doctor for this consultation.',
          code: 'FORBIDDEN',
        });
      }

      // If urgency or special instructions are provided, store them encrypted in encryptedResult
      // until actual results are available
      let encryptedResult: string | undefined;
      if (urgency || specialInstructions) {
        const dataKey = decryptDataKey(consultation.encryptedDataKey);
        const metadata: Record<string, string> = {};
        if (urgency) metadata.urgency = urgency;
        if (specialInstructions) metadata.specialInstructions = specialInstructions;
        encryptedResult = encryptJSON({ metadata, result: null }, dataKey);
      }

      const investigation = await prisma.investigation.create({
        data: {
          consultationId,
          type: type as never,
          name,
          requestedBy: doctor.id,
          encryptedResult,
        },
      });

      await auditLog({
        userId: doctorUserId,
        action: 'CREATE_INVESTIGATION',
        resource: 'Investigation',
        resourceId: investigation.id,
        metadata: { consultationId, type, name, urgency },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: investigation.id,
          consultationId: investigation.consultationId,
          type: investigation.type,
          name: investigation.name,
          requestedBy: investigation.requestedBy,
          resultDate: investigation.resultDate,
          updatedAt: investigation.updatedAt,
          // Return metadata (urgency, specialInstructions) in the response for convenience
          urgency: urgency ?? null,
          specialInstructions: specialInstructions ?? null,
          hasResult: false,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // GET /investigations/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/investigations/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;
      const userRole = request.user!.role;

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          patient: { select: { userId: true } },
          investigations: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      // Access control: patient owns it OR assigned doctor
      const isOwner = consultation.patient.userId === userId;
      const isAssignedDoctor =
        userRole === 'DOCTOR' &&
        consultation.doctorId !== null &&
        (await prisma.doctor.findFirst({
          where: { userId, id: consultation.doctorId! },
        })) !== null;

      if (!isOwner && !isAssignedDoctor) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied.',
          code: 'FORBIDDEN',
        });
      }

      const dataKey = decryptDataKey(consultation.encryptedDataKey);

      const investigations = consultation.investigations.map((inv) => {
        // For completed (has result), decrypt; for pending, return metadata only
        let resultData: Record<string, unknown> | null = null;
        let decryptedResult: string | null = null;
        let urgency: string | null = null;
        let specialInstructions: string | null = null;

        if (inv.encryptedResult) {
          try {
            const decrypted = decryptJSON(inv.encryptedResult, dataKey) as {
              result: string | null;
              metadata?: { urgency?: string; specialInstructions?: string };
            };

            if (decrypted.result !== null && decrypted.result !== undefined) {
              // Has actual result
              decryptedResult = decrypted.result;
              resultData = { result: decryptedResult };
            }
            // Always surface metadata
            urgency = decrypted.metadata?.urgency ?? null;
            specialInstructions = decrypted.metadata?.specialInstructions ?? null;
          } catch {
            // If decryption fails, omit result data silently
          }
        }

        return {
          id: inv.id,
          consultationId: inv.consultationId,
          type: inv.type,
          name: inv.name,
          requestedBy: inv.requestedBy,
          resultDate: inv.resultDate,
          updatedAt: inv.updatedAt,
          hasResult: decryptedResult !== null,
          result: decryptedResult,
          urgency,
          specialInstructions,
        };
      });

      await auditLog({
        userId,
        action: 'VIEW_INVESTIGATIONS',
        resource: 'Consultation',
        resourceId: consultationId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: investigations,
      });
    }
  );

  // ----------------------------------------------------------
  // PUT /investigations/:investigationId/result
  // ----------------------------------------------------------
  fastify.put(
    '/investigations/:investigationId/result',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { investigationId } = request.params as { investigationId: string };
      const parsed = AddResultSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { result, resultDate } = parsed.data;
      const doctorUserId = request.user!.sub;

      // Verify doctor identity
      const doctor = await prisma.doctor.findUnique({
        where: { userId: doctorUserId },
        select: { id: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      // Fetch investigation with its consultation
      const investigation = await prisma.investigation.findUnique({
        where: { id: investigationId },
        include: {
          consultation: { select: { id: true, doctorId: true, encryptedDataKey: true } },
        },
      });

      if (!investigation) {
        return reply.status(404).send({ success: false, error: 'Investigation not found.' });
      }

      if (investigation.consultation.doctorId !== doctor.id) {
        return reply.status(403).send({
          success: false,
          error: 'You are not the assigned doctor for this consultation.',
          code: 'FORBIDDEN',
        });
      }

      const dataKey = decryptDataKey(investigation.consultation.encryptedDataKey);

      // Preserve any existing metadata (urgency, specialInstructions) while adding the result
      let existingMetadata: Record<string, string> = {};
      if (investigation.encryptedResult) {
        try {
          const existing = decryptJSON(investigation.encryptedResult, dataKey) as {
            metadata?: Record<string, string>;
          };
          existingMetadata = existing.metadata ?? {};
        } catch {
          // Ignore — start fresh
        }
      }

      const encryptedResult = encryptJSON(
        { result, metadata: existingMetadata },
        dataKey
      );

      const resultDateParsed = resultDate ? new Date(resultDate) : new Date();

      const updated = await prisma.investigation.update({
        where: { id: investigationId },
        data: {
          encryptedResult,
          resultDate: resultDateParsed,
        },
      });

      await auditLog({
        userId: doctorUserId,
        action: 'ADD_INVESTIGATION_RESULT',
        resource: 'Investigation',
        resourceId: investigationId,
        metadata: {
          consultationId: investigation.consultationId,
          doctorId: doctor.id,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.send({
        success: true,
        data: {
          id: updated.id,
          consultationId: updated.consultationId,
          type: updated.type,
          name: updated.name,
          requestedBy: updated.requestedBy,
          resultDate: updated.resultDate,
          updatedAt: updated.updatedAt,
          hasResult: true,
          result,
          urgency: existingMetadata.urgency ?? null,
          specialInstructions: existingMetadata.specialInstructions ?? null,
        },
      });
    }
  );
}
