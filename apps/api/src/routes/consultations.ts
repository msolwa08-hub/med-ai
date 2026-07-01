import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireConsent } from '../middleware/consent.js';
import { auditLog } from '../services/audit.service.js';
import { Notifications } from '../services/notification.service.js';
import {
  encryptJSON,
  decryptJSON,
  encryptField,
  decryptField,
  generateDataKey,
  encryptDataKey,
  decryptDataKey,
} from '../lib/encryption.js';
import type { MedicationEntry, ReferralEntry } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const CreateConsultationSchema = z.object({
  language: z.string().min(1),
  consultationType: z.enum(['IN_PERSON', 'TELECONSULT', 'HOME_VISIT']).optional(),
  doctorId: z.string().optional(),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['HISTORY_TAKING', 'DOCTOR_REVIEW', 'EXAMINATION', 'COMPLETED', 'CANCELLED']),
});

const ExaminationSchema = z.object({
  vitalSigns: z.object({
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional(),
    heartRate: z.number().optional(),
    respiratoryRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    painScore: z.number().min(0).max(10).optional(),
  }),
  generalExamination: z.object({
    generalAppearance: z.string().optional(),
    handsNails: z.string().optional(),
    headNeck: z.string().optional(),
    jvp: z.string().optional(),
    lymphNodes: z.string().optional(),
  }),
  systemicExamination: z.object({
    cardiovascular: z.string().optional(),
    respiratory: z.string().optional(),
    abdominal: z.string().optional(),
    neurological: z.string().optional(),
    msk: z.string().optional(),
    skin: z.string().optional(),
  }),
});

const ManagementPlanSchema = z.object({
  diagnosis: z.string().min(1),
  medications: z.array(
    z.object({
      name: z.string(),
      dose: z.string(),
      frequency: z.string(),
      duration: z.string().optional(),
      route: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  procedures: z.string().optional(),
  referrals: z
    .array(
      z.object({
        specialty: z.string(),
        reason: z.string(),
        urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']),
        facility: z.string().optional(),
      })
    )
    .optional(),
  followUpDays: z.number().int().positive().optional(),
  patientInstructions: z.string().optional(),
});

// ============================================================
// Helpers
// ============================================================

/**
 * Validate that the requesting user has access to this consultation.
 * - Patients can only access their own consultations.
 * - Doctors can access consultations where they are assigned.
 * - Admins have unrestricted access.
 */
async function checkConsultationAccess(
  userId: string,
  role: string,
  consultationId: string
): Promise<
  | {
      ok: true;
      consultation: NonNullable<Awaited<ReturnType<typeof getFullConsultation>>>;
    }
  | { ok: false; status: number; error: string; code: string }
> {
  const consultation = await getFullConsultation(consultationId);

  if (!consultation) {
    return { ok: false, status: 404, error: 'Consultation not found.', code: 'NOT_FOUND' };
  }

  if (role === 'ADMIN') {
    return { ok: true, consultation };
  }

  if (role === 'PATIENT') {
    // Patient must own the consultation
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || consultation.patientId !== patient.id) {
      return { ok: false, status: 403, error: 'Access denied.', code: 'FORBIDDEN' };
    }
  } else if (role === 'DOCTOR') {
    // Doctor must be assigned to this consultation
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctor || consultation.doctorId !== doctor.id) {
      return { ok: false, status: 403, error: 'Access denied.', code: 'FORBIDDEN' };
    }
  } else {
    return { ok: false, status: 403, error: 'Access denied.', code: 'FORBIDDEN' };
  }

  return { ok: true, consultation };
}

async function getFullConsultation(consultationId: string) {
  return prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          preferredLanguage: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          doctorType: true,
          specialization: true,
        },
      },
    },
  });
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  HISTORY_TAKING: ['DOCTOR_REVIEW', 'CANCELLED'],
  DOCTOR_REVIEW: ['EXAMINATION', 'COMPLETED', 'CANCELLED'],
  EXAMINATION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================================
// Route plugin
// ============================================================

export async function consultationRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /consultations
  fastify.post(
    '/consultations',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = CreateConsultationSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { language, consultationType, doctorId } = parsed.data;

        const patient = await prisma.patient.findUnique({ where: { userId } });
        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found. Please complete your profile first.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        // If doctorId provided, verify it exists
        if (doctorId) {
          const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
          if (!doctor) {
            return reply.status(404).send({
              success: false,
              error: 'Doctor not found.',
              code: 'DOCTOR_NOT_FOUND',
            });
          }
        }

        // Generate per-consultation data key
        const dataKey = generateDataKey();
        const encryptedDataKey = encryptDataKey(dataKey);

        const EMPTY = 'Not yet recorded';

        const consultation = await prisma.consultation.create({
          data: {
            patientId: patient.id,
            doctorId: doctorId ?? null,
            consultationType: (consultationType ?? 'IN_PERSON') as never,
            encryptedDataKey,
            status: 'HISTORY_TAKING',
            medicalHistory: {
              create: {
                language: language as never,
                chiefComplaint: encryptField(EMPTY, dataKey),
                historyOfPresentIllness: encryptField(EMPTY, dataKey),
                pastMedicalHistory: encryptField(EMPTY, dataKey),
                medications: encryptField(EMPTY, dataKey),
                allergies: encryptField(EMPTY, dataKey),
                familyHistory: encryptField(EMPTY, dataKey),
                socialHistory: encryptField(EMPTY, dataKey),
                systemsReview: encryptField(EMPTY, dataKey),
                aiConversationLog: encryptField(JSON.stringify([]), dataKey),
              },
            },
          },
        });

        await auditLog({
          userId,
          action: 'CONSULTATION_CREATED',
          resource: 'Consultation',
          resourceId: consultation.id,
          metadata: { patientId: patient.id, consultationType, doctorId },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            consultationId: consultation.id,
            status: consultation.status,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /consultations error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /consultations/:id
  fastify.get(
    '/consultations/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };
        const role = request.user!.role;

        const access = await checkConsultationAccess(userId, role, id);
        if (!access.ok) {
          return reply.status(access.status).send({
            success: false,
            error: access.error,
            code: access.code,
          });
        }

        const c = access.consultation;

        return reply.send({
          success: true,
          data: {
            id: c.id,
            patientId: c.patientId,
            doctorId: c.doctorId,
            status: c.status,
            consultationType: c.consultationType,
            startedAt: c.startedAt,
            completedAt: c.completedAt,
            patient: c.patient,
            doctor: c.doctor,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /consultations/:id error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // PUT /consultations/:id/status
  fastify.put(
    '/consultations/:id/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };
        const role = request.user!.role;

        const parsed = UpdateStatusSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { status: newStatus } = parsed.data;

        const access = await checkConsultationAccess(userId, role, id);
        if (!access.ok) {
          return reply.status(access.status).send({
            success: false,
            error: access.error,
            code: access.code,
          });
        }

        const currentStatus = access.consultation.status;
        const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];

        if (!allowed.includes(newStatus)) {
          return reply.status(400).send({
            success: false,
            error: `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}.`,
            code: 'INVALID_STATUS_TRANSITION',
          });
        }

        const updated = await prisma.consultation.update({
          where: { id },
          data: {
            status: newStatus as never,
            ...(newStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
          },
        });

        await auditLog({
          userId,
          action: 'CONSULTATION_STATUS_UPDATE',
          resource: 'Consultation',
          resourceId: id,
          metadata: { from: currentStatus, to: newStatus },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        // Notify patient of status changes (non-blocking)
        if (newStatus === 'DOCTOR_REVIEW' || newStatus === 'COMPLETED') {
          const statusConsultation = await prisma.consultation.findUnique({
            where: { id },
            select: { patient: { select: { userId: true } } },
          });
          if (statusConsultation?.patient?.userId) {
            Notifications.consultationStatusChanged(
              statusConsultation.patient.userId,
              newStatus,
              id
            ).catch(() => {});
          }
        }

        return reply.send({
          success: true,
          data: {
            consultationId: updated.id,
            status: updated.status,
            completedAt: updated.completedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /consultations/:id/status error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /consultations/:id/examination
  fastify.post(
    '/consultations/:id/examination',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        const parsed = ExaminationSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { vitalSigns, generalExamination, systemicExamination } = parsed.data;

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id },
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

        // Decrypt the consultation data key
        const dataKey = decryptDataKey(consultation.encryptedDataKey);

        // Encrypt each section with the consultation data key
        const encryptedVitalSigns = encryptJSON(vitalSigns, dataKey);
        const encryptedGeneralExam = encryptJSON(generalExamination, dataKey);
        const encryptedSystemicExam = encryptJSON(systemicExamination, dataKey);

        // Upsert ExaminationFindings
        const findings = await prisma.examinationFindings.upsert({
          where: { consultationId: id },
          create: {
            consultationId: id,
            vitalSigns: encryptedVitalSigns,
            generalExam: encryptedGeneralExam,
            systemicExam: encryptedSystemicExam,
          },
          update: {
            vitalSigns: encryptedVitalSigns,
            generalExam: encryptedGeneralExam,
            systemicExam: encryptedSystemicExam,
          },
        });

        // Advance status to EXAMINATION if still at an earlier stage
        if (
          consultation.status === 'HISTORY_TAKING' ||
          consultation.status === 'DOCTOR_REVIEW'
        ) {
          await prisma.consultation.update({
            where: { id },
            data: { status: 'EXAMINATION' },
          });
        }

        await auditLog({
          userId,
          action: 'EXAMINATION_RECORDED',
          resource: 'ExaminationFindings',
          resourceId: findings.id,
          metadata: { consultationId: id, doctorId: doctor.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            findingsId: findings.id,
            consultationId: id,
            recordedAt: findings.recordedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /consultations/:id/examination error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /consultations/:id/examination
  fastify.get(
    '/consultations/:id/examination',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id },
          include: { examinationFindings: true },
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

        if (!consultation.examinationFindings) {
          return reply.status(404).send({
            success: false,
            error: 'No examination findings recorded for this consultation.',
            code: 'FINDINGS_NOT_FOUND',
          });
        }

        const dataKey = decryptDataKey(consultation.encryptedDataKey);
        const findings = consultation.examinationFindings;

        return reply.send({
          success: true,
          data: {
            findingsId: findings.id,
            consultationId: id,
            recordedAt: findings.recordedAt,
            vitalSigns: decryptJSON(findings.vitalSigns, dataKey),
            generalExamination: decryptJSON(findings.generalExam, dataKey),
            systemicExamination: decryptJSON(findings.systemicExam, dataKey),
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /consultations/:id/examination error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /consultations/:id/management
  fastify.post(
    '/consultations/:id/management',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        const parsed = ManagementPlanSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const {
          diagnosis,
          medications,
          procedures,
          referrals,
          followUpDays,
          patientInstructions,
        } = parsed.data;

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id },
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

        const dataKey = decryptDataKey(consultation.encryptedDataKey);

        const plan = await prisma.managementPlan.upsert({
          where: { consultationId: id },
          create: {
            consultationId: id,
            diagnosis: encryptField(diagnosis, dataKey),
            medications: encryptJSON(medications as MedicationEntry[], dataKey),
            procedures: procedures ? encryptField(procedures, dataKey) : undefined,
            referrals: referrals
              ? encryptJSON(referrals as ReferralEntry[], dataKey)
              : undefined,
            followUpDays: followUpDays ?? undefined,
            doctorNotes: patientInstructions
              ? encryptField(patientInstructions, dataKey)
              : undefined,
          },
          update: {
            diagnosis: encryptField(diagnosis, dataKey),
            medications: encryptJSON(medications as MedicationEntry[], dataKey),
            procedures: procedures ? encryptField(procedures, dataKey) : null,
            referrals: referrals
              ? encryptJSON(referrals as ReferralEntry[], dataKey)
              : null,
            followUpDays: followUpDays ?? null,
            doctorNotes: patientInstructions
              ? encryptField(patientInstructions, dataKey)
              : null,
          },
        });

        await auditLog({
          userId,
          action: 'MANAGEMENT_PLAN_SAVED',
          resource: 'ManagementPlan',
          resourceId: plan.id,
          metadata: { consultationId: id, doctorId: doctor.id },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            planId: plan.id,
            consultationId: id,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /consultations/:id/management error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /consultations/:id/management
  fastify.get(
    '/consultations/:id/management',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };
        const role = request.user!.role;

        const access = await checkConsultationAccess(userId, role, id);
        if (!access.ok) {
          return reply.status(access.status).send({
            success: false,
            error: access.error,
            code: access.code,
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id },
          include: { managementPlan: true },
        });

        if (!consultation?.managementPlan) {
          return reply.status(404).send({
            success: false,
            error: 'Management plan not yet recorded for this consultation.',
            code: 'PLAN_NOT_FOUND',
          });
        }

        const dataKey = decryptDataKey(consultation.encryptedDataKey);
        const plan = consultation.managementPlan;

        return reply.send({
          success: true,
          data: {
            planId: plan.id,
            consultationId: id,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
            diagnosis: decryptField(plan.diagnosis, dataKey),
            medications: decryptJSON(plan.medications, dataKey),
            procedures: plan.procedures ? decryptField(plan.procedures, dataKey) : null,
            referrals: plan.referrals ? decryptJSON(plan.referrals, dataKey) : null,
            followUpDays: plan.followUpDays,
            followUp: plan.followUpDays ? `${plan.followUpDays} days` : null,
            patientInstructions: plan.doctorNotes
              ? decryptField(plan.doctorNotes, dataKey)
              : null,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /consultations/:id/management error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /consultations/:id/full-record
  fastify.get(
    '/consultations/:id/full-record',
    { preHandler: [authenticate, requireRole('DOCTOR'), requireConsent] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id: consultationId } = request.params as { id: string };

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true,
                preferredLanguage: true,
              },
            },
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                doctorType: true,
                specialization: true,
              },
            },
            medicalHistory: true,
            differentialDiagnosis: true,
            examinationFindings: true,
            managementPlan: true,
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

        const dataKey = decryptDataKey(consultation.encryptedDataKey);

        // Decrypt medical history
        let medicalHistory: Record<string, unknown> | null = null;
        if (consultation.medicalHistory) {
          const mh = consultation.medicalHistory;
          medicalHistory = {
            id: mh.id,
            language: mh.language,
            doctorConfirmed: mh.doctorConfirmed,
            confirmedAt: mh.confirmedAt,
            chiefComplaint: decryptField(mh.chiefComplaint, dataKey),
            historyOfPresentIllness: decryptField(mh.historyOfPresentIllness, dataKey),
            pastMedicalHistory: decryptField(mh.pastMedicalHistory, dataKey),
            medications: decryptField(mh.medications, dataKey),
            allergies: decryptField(mh.allergies, dataKey),
            familyHistory: decryptField(mh.familyHistory, dataKey),
            socialHistory: decryptField(mh.socialHistory, dataKey),
            systemsReview: decryptField(mh.systemsReview, dataKey),
            doctorNotes: mh.doctorNotes ? decryptField(mh.doctorNotes, dataKey) : null,
          };
        }

        // Decrypt examination findings
        let examinationFindings: Record<string, unknown> | null = null;
        if (consultation.examinationFindings) {
          const ef = consultation.examinationFindings;
          examinationFindings = {
            id: ef.id,
            recordedAt: ef.recordedAt,
            vitalSigns: decryptJSON(ef.vitalSigns, dataKey),
            generalExamination: decryptJSON(ef.generalExam, dataKey),
            systemicExamination: decryptJSON(ef.systemicExam, dataKey),
            doctorNotes: ef.doctorNotes ? decryptField(ef.doctorNotes, dataKey) : null,
          };
        }

        // Decrypt management plan
        let managementPlan: Record<string, unknown> | null = null;
        if (consultation.managementPlan) {
          const mp = consultation.managementPlan;
          managementPlan = {
            id: mp.id,
            createdAt: mp.createdAt,
            updatedAt: mp.updatedAt,
            diagnosis: decryptField(mp.diagnosis, dataKey),
            medications: decryptJSON(mp.medications, dataKey),
            procedures: mp.procedures ? decryptField(mp.procedures, dataKey) : null,
            referrals: mp.referrals ? decryptJSON(mp.referrals, dataKey) : null,
            followUpDays: mp.followUpDays,
            followUp: mp.followUpDays ? `${mp.followUpDays} days` : null,
            doctorNotes: mp.doctorNotes ? decryptField(mp.doctorNotes, dataKey) : null,
          };
        }

        await auditLog({
          userId,
          action: 'FULL_RECORD_ACCESSED',
          resource: 'Consultation',
          resourceId: consultationId,
          metadata: {
            doctorId: doctor.id,
            patientId: consultation.patientId,
            sections: ['medicalHistory', 'differentialDiagnosis', 'examinationFindings', 'managementPlan'],
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            consultation: {
              id: consultation.id,
              status: consultation.status,
              consultationType: consultation.consultationType,
              startedAt: consultation.startedAt,
              completedAt: consultation.completedAt,
              patient: consultation.patient,
              doctor: consultation.doctor,
            },
            medicalHistory,
            differentialDiagnosis: consultation.differentialDiagnosis,
            examinationFindings,
            managementPlan,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /consultations/:id/full-record error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /consultations/:id/complete
  fastify.post(
    '/consultations/:id/complete',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const { id } = request.params as { id: string };

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultation = await prisma.consultation.findUnique({
          where: { id },
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

        if (consultation.status === 'COMPLETED') {
          return reply.status(409).send({
            success: false,
            error: 'Consultation is already completed.',
            code: 'ALREADY_COMPLETED',
          });
        }

        if (consultation.status === 'CANCELLED') {
          return reply.status(409).send({
            success: false,
            error: 'Cannot complete a cancelled consultation.',
            code: 'CONSULTATION_CANCELLED',
          });
        }

        const now = new Date();
        const updated = await prisma.consultation.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
          },
        });

        await auditLog({
          userId,
          action: 'CONSULTATION_COMPLETED',
          resource: 'Consultation',
          resourceId: id,
          metadata: { doctorId: doctor.id, patientId: updated.patientId, completedAt: now },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        // Notify patient that consultation is complete (non-blocking)
        const completedConsultation = await prisma.consultation.findUnique({
          where: { id },
          select: { patient: { select: { userId: true } } },
        });
        if (completedConsultation?.patient?.userId) {
          Notifications.consultationStatusChanged(
            completedConsultation.patient.userId,
            'COMPLETED',
            id
          ).catch(() => {});
        }

        return reply.send({
          success: true,
          data: {
            consultationId: updated.id,
            status: updated.status,
            completedAt: updated.completedAt,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /consultations/:id/complete error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
