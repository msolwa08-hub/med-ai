import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { checkPrescriptionSafety } from '../services/prescription-safety.js';
import { checkPaymentGate, paymentRequiredBody } from '../services/payment-gate.js';
import { decryptField, decryptJSON, decryptDataKey } from '../lib/encryption.js';
import {
  createPrescription,
  getConsultationPrescriptions,
  getPatientPrescriptions,
  generatePrescriptionHTML,
} from '../services/prescription.service.js';

// ============================================================
// Schemas
// ============================================================

const PrescriptionItemSchema = z.object({
  medication: z.string().min(1).max(500),
  dose: z.string().min(1).max(200),
  route: z.enum(['Oral', 'IV', 'IM', 'Topical', 'Subcutaneous', 'Inhaled', 'Rectal', 'Sublingual', 'Nasal', 'Other']),
  frequency: z.string().min(1).max(200),
  duration: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  instructions: z.string().min(1).max(1000),
  isScheduled: z.boolean(),
  scheduleNumber: z.number().int().min(1).max(7).optional(),
  repetitions: z.number().int().positive().optional(),
});

const CreatePrescriptionSchema = z.object({
  consultationId: z.string().min(1),
  items: z.array(PrescriptionItemSchema).min(1, 'At least one medication item is required.'),
  isRepeat: z.boolean().default(false),
  repeatTotal: z.number().int().min(1).max(11).optional(),
  notes: z.string().max(2000).optional(),
  // Safety warnings return 409; the doctor may consciously override.
  // Every override is audit-logged.
  overrideSafetyWarnings: z.boolean().default(false),
});

const ListPrescriptionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================
// Route plugin
// ============================================================

export async function prescriptionRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /prescriptions — Create prescription (doctor only, HPCSA verified)
  // ----------------------------------------------------------
  fastify.post(
    '/prescriptions',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = CreatePrescriptionSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { consultationId, items, isRepeat, repeatTotal, notes, overrideSafetyWarnings } = parsed.data;

        // Validate: scheduled items must include a schedule number
        for (const item of items) {
          if (item.isScheduled && !item.scheduleNumber) {
            return reply.status(400).send({
              success: false,
              error: `Scheduled substance "${item.medication}" requires a scheduleNumber (1-7).`,
              code: 'MISSING_SCHEDULE_NUMBER',
            });
          }
        }

        // Validate: repeat scripts require repeatTotal
        if (isRepeat && !repeatTotal) {
          return reply.status(400).send({
            success: false,
            error: 'repeatTotal is required for repeat prescriptions.',
            code: 'MISSING_REPEAT_TOTAL',
          });
        }

        // Look up the doctor
        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { id: true, hpcsaStatus: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        // Verify the consultation exists and the doctor is assigned to it
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            status: true,
            encryptedDataKey: true,
            medicalHistory: { select: { allergies: true, clinicalScores: true } },
          },
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'NOT_FOUND',
          });
        }

        if (consultation.doctorId !== doctor.id) {
          return reply.status(403).send({
            success: false,
            error: 'You are not the assigned doctor for this consultation.',
            code: 'FORBIDDEN',
          });
        }

        // ── Safety gate: allergy / pregnancy / renal / interaction checks ──
        let allergiesText: string | undefined;
        let isPregnant = false;
        try {
          const dataKey = decryptDataKey(consultation.encryptedDataKey);
          if (consultation.medicalHistory?.allergies) {
            allergiesText = decryptField(consultation.medicalHistory.allergies, dataKey);
          }
          if (consultation.medicalHistory?.clinicalScores) {
            const scores = decryptJSON(consultation.medicalHistory.clinicalScores, dataKey) as {
              mode?: string;
              gestationalAgeAtVisit?: string;
            };
            isPregnant = scores?.mode === 'OBSTETRIC' || !!scores?.gestationalAgeAtVisit;
          }
        } catch {
          // Context unavailable — checks degrade gracefully to interaction-only
        }

        const problems = await prisma.diagnosis.findMany({
          where: { patientId: consultation.patientId, status: { in: ['ACTIVE', 'CHRONIC'] } },
          select: { icd10Code: true },
          take: 50,
        });

        const safetyWarnings = checkPrescriptionSafety(
          items.map((i) => i.medication),
          {
            allergiesText,
            isPregnant,
            problemCodes: problems.map((d) => d.icd10Code).filter((x): x is string => !!x),
          }
        );

        if (safetyWarnings.length > 0 && !overrideSafetyWarnings) {
          return reply.status(409).send({
            success: false,
            error: 'Prescription safety warnings — review and resubmit with overrideSafetyWarnings to proceed.',
            code: 'SAFETY_WARNINGS',
            warnings: safetyWarnings,
          });
        }

        if (safetyWarnings.length > 0 && overrideSafetyWarnings) {
          await auditLog({
            userId,
            action: 'PRESCRIPTION_SAFETY_OVERRIDE',
            resource: 'Prescription',
            resourceId: consultationId,
            metadata: { warnings: safetyWarnings },
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
          });
        }

        if (consultation.status === 'CANCELLED') {
          return reply.status(400).send({
            success: false,
            error: 'Cannot issue a prescription for a cancelled consultation.',
            code: 'CONSULTATION_CANCELLED',
          });
        }

        // ── Payment gate: scripts are a billable deliverable ──────────────
        const gate = await checkPaymentGate(consultationId);
        if (!gate.allowed) {
          return reply.status(402).send(paymentRequiredBody(gate));
        }

        const result = await createPrescription({
          consultationId,
          doctorId: doctor.id,
          patientId: consultation.patientId,
          items,
          isRepeat,
          repeatTotal,
          notes,
        });

        await auditLog({
          userId,
          action: 'PRESCRIPTION_ISSUED',
          resource: 'Prescription',
          resourceId: result.id,
          metadata: {
            scriptNumber: result.scriptNumber,
            consultationId,
            patientId: consultation.patientId,
            containsDDA: result.containsDDA,
            isRepeat,
            itemCount: items.length,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            prescriptionId: result.id,
            scriptNumber: result.scriptNumber,
            containsDDA: result.containsDDA,
          },
          message: `Prescription ${result.scriptNumber} issued successfully.${result.containsDDA ? ' This prescription contains DDA scheduled substances.' : ''}`,
        });
      } catch (err) {
        fastify.log.error(err, 'POST /prescriptions error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /prescriptions/consultation/:consultationId
  // ----------------------------------------------------------
  fastify.get(
    '/prescriptions/consultation/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const role = request.user!.role;
        const { consultationId } = request.params as { consultationId: string };

        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            patient: { select: { userId: true } },
          },
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'NOT_FOUND',
          });
        }

        // Access control: patient owns the consultation OR assigned doctor OR admin
        if (role === 'PATIENT') {
          if (consultation.patient.userId !== userId) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role === 'DOCTOR') {
          const doctor = await prisma.doctor.findUnique({
            where: { userId },
            select: { id: true },
          });
          if (!doctor || consultation.doctorId !== doctor.id) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role !== 'ADMIN') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied.',
            code: 'FORBIDDEN',
          });
        }

        const prescriptions = await getConsultationPrescriptions(consultationId);

        await auditLog({
          userId,
          action: 'PRESCRIPTIONS_VIEWED',
          resource: 'Prescription',
          metadata: { consultationId, count: prescriptions.length },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: { prescriptions },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /prescriptions/consultation/:consultationId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /prescriptions/patient/:patientId — Patient views their prescriptions
  // ----------------------------------------------------------
  fastify.get(
    '/prescriptions/patient/:patientId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const role = request.user!.role;
        const { patientId } = request.params as { patientId: string };

        const queryParsed = ListPrescriptionsQuerySchema.safeParse(request.query);
        if (!queryParsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid query parameters',
            details: queryParsed.error.flatten(),
          });
        }
        const { limit } = queryParsed.data;

        // Access control: patient can only view their own, doctor/admin can view any
        if (role === 'PATIENT') {
          const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
          });
          if (!patient || patient.id !== patientId) {
            return reply.status(403).send({
              success: false,
              error: 'You can only view your own prescriptions.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role === 'DOCTOR') {
          // Doctors may only view prescriptions for patients they have a consultation with
          const doctor = await prisma.doctor.findUnique({
            where: { userId },
            select: { id: true },
          });
          if (!doctor) {
            return reply.status(404).send({
              success: false,
              error: 'Doctor profile not found.',
              code: 'DOCTOR_NOT_FOUND',
            });
          }

          const hasConsultation = await prisma.consultation.findFirst({
            where: { patientId, doctorId: doctor.id },
          });
          if (!hasConsultation) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied. No shared consultation with this patient.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role !== 'ADMIN') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied.',
            code: 'FORBIDDEN',
          });
        }

        // Verify patient exists
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true },
        });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient not found.',
            code: 'NOT_FOUND',
          });
        }

        const prescriptions = await getPatientPrescriptions(patientId, limit);

        await auditLog({
          userId,
          action: 'PATIENT_PRESCRIPTIONS_VIEWED',
          resource: 'Prescription',
          metadata: { patientId, count: prescriptions.length },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: { prescriptions, total: prescriptions.length },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /prescriptions/patient/:patientId error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /prescriptions/:id/pdf — Download prescription as HTML (for PDF conversion)
  // ----------------------------------------------------------
  fastify.get(
    '/prescriptions/:id/pdf',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const role = request.user!.role;
        const { id } = request.params as { id: string };

        const prescription = await prisma.prescription.findUnique({
          where: { id },
          select: {
            id: true,
            patientId: true,
            doctorId: true,
            scriptNumber: true,
            status: true,
            consultation: {
              select: {
                patient: { select: { userId: true } },
                doctor: { select: { userId: true } },
              },
            },
          },
        });

        if (!prescription) {
          return reply.status(404).send({
            success: false,
            error: 'Prescription not found.',
            code: 'NOT_FOUND',
          });
        }

        // Access control
        if (role === 'PATIENT') {
          if (prescription.consultation.patient.userId !== userId) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role === 'DOCTOR') {
          if (prescription.consultation.doctor?.userId !== userId) {
            return reply.status(403).send({
              success: false,
              error: 'Access denied.',
              code: 'FORBIDDEN',
            });
          }
        } else if (role !== 'ADMIN') {
          return reply.status(403).send({
            success: false,
            error: 'Access denied.',
            code: 'FORBIDDEN',
          });
        }

        if (prescription.status === 'CANCELLED') {
          return reply.status(410).send({
            success: false,
            error: 'This prescription has been cancelled and cannot be downloaded.',
            code: 'PRESCRIPTION_CANCELLED',
          });
        }

        const html = await generatePrescriptionHTML(id);

        await auditLog({
          userId,
          action: 'PRESCRIPTION_PDF_DOWNLOADED',
          resource: 'Prescription',
          resourceId: id,
          metadata: {
            scriptNumber: prescription.scriptNumber,
            patientId: prescription.patientId,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply
          .status(200)
          .header('Content-Type', 'text/html; charset=utf-8')
          .header('Content-Disposition', `inline; filename="prescription-${prescription.scriptNumber}.html"`)
          .send(html);
      } catch (err) {
        fastify.log.error(err, 'GET /prescriptions/:id/pdf error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // PUT /prescriptions/:id/cancel — Cancel prescription (doctor only)
  // ----------------------------------------------------------
  fastify.put(
    '/prescriptions/:id/cancel',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const prescription = await prisma.prescription.findUnique({
          where: { id },
          select: {
            id: true,
            doctorId: true,
            status: true,
            scriptNumber: true,
            patientId: true,
          },
        });

        if (!prescription) {
          return reply.status(404).send({
            success: false,
            error: 'Prescription not found.',
            code: 'NOT_FOUND',
          });
        }

        if (prescription.doctorId !== doctor.id) {
          return reply.status(403).send({
            success: false,
            error: 'You can only cancel prescriptions you issued.',
            code: 'FORBIDDEN',
          });
        }

        if (prescription.status === 'CANCELLED') {
          return reply.status(409).send({
            success: false,
            error: 'Prescription is already cancelled.',
            code: 'ALREADY_CANCELLED',
          });
        }

        if (prescription.status === 'DISPENSED') {
          return reply.status(409).send({
            success: false,
            error: 'Cannot cancel a prescription that has already been dispensed.',
            code: 'ALREADY_DISPENSED',
          });
        }

        const updated = await prisma.prescription.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        await auditLog({
          userId,
          action: 'PRESCRIPTION_CANCELLED',
          resource: 'Prescription',
          resourceId: id,
          metadata: {
            scriptNumber: prescription.scriptNumber,
            patientId: prescription.patientId,
            doctorId: doctor.id,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            prescriptionId: updated.id,
            scriptNumber: updated.scriptNumber,
            status: updated.status,
          },
          message: `Prescription ${prescription.scriptNumber} has been cancelled.`,
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /prescriptions/:id/cancel error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
