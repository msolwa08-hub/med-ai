import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { decryptField } from '../lib/encryption.js';
import { findNearbyDoctors, updateDoctorLocation } from '../services/geolocation.service.js';
import type { DoctorType } from '@prisma/client';

// ============================================================
// Schemas
// ============================================================

const UpdateDoctorSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  bio: z.string().max(1000).optional(),
  consultationFee: z.number().nonnegative().optional(),
  languages: z.array(z.string()).optional(),
  specialization: z.string().optional(),
  availabilityRadius: z.number().positive().optional(),
});

const AvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().positive().optional(),
});

const AcceptPatientSchema = z.object({
  consultationId: z.string().min(1),
});

const DeclinePatientSchema = z.object({
  consultationId: z.string().min(1),
});

// ============================================================
// Route plugin
// ============================================================

export async function doctorRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /doctors/me
  fastify.get(
    '/doctors/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const doctor = await prisma.doctor.findUnique({
          where: { userId },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        return reply.send({
          success: true,
          data: {
            id: doctor.id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            hpcsaNumber: doctor.hpcsaNumber,
            hpcsaStatus: doctor.hpcsaStatus,
            doctorType: doctor.doctorType,
            specialization: doctor.specialization,
            isAvailable: doctor.isAvailable,
            rating: doctor.rating,
            totalReviews: doctor.totalReviews,
            consultationFee: doctor.consultationFee,
            bio: doctor.bio,
            languages: doctor.languages,
            currentLat: doctor.currentLat,
            currentLng: doctor.currentLng,
            availabilityRadius: doctor.availabilityRadius,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctors/me error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // PUT /doctors/me
  fastify.put(
    '/doctors/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = UpdateDoctorSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const {
          firstName,
          lastName,
          bio,
          consultationFee,
          languages,
          specialization,
          availabilityRadius,
        } = parsed.data;

        const updateData: Record<string, unknown> = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (bio !== undefined) updateData.bio = bio;
        if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
        if (languages !== undefined) updateData.languages = languages;
        if (specialization !== undefined) updateData.specialization = specialization;
        if (availabilityRadius !== undefined) updateData.availabilityRadius = availabilityRadius;

        const updated = await prisma.doctor.update({
          where: { userId },
          data: updateData as never,
        });

        await auditLog({
          userId,
          action: 'DOCTOR_PROFILE_UPDATE',
          resource: 'Doctor',
          resourceId: updated.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            id: updated.id,
            firstName: updated.firstName,
            lastName: updated.lastName,
            hpcsaNumber: updated.hpcsaNumber,
            hpcsaStatus: updated.hpcsaStatus,
            doctorType: updated.doctorType,
            specialization: updated.specialization,
            isAvailable: updated.isAvailable,
            rating: updated.rating,
            totalReviews: updated.totalReviews,
            consultationFee: updated.consultationFee,
            bio: updated.bio,
            languages: updated.languages,
            availabilityRadius: updated.availabilityRadius,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /doctors/me error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /doctors/nearby
  fastify.get(
    '/doctors/nearby',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const query = request.query as Record<string, string>;

        const lat = parseFloat(query.lat);
        const lng = parseFloat(query.lng);

        if (isNaN(lat) || isNaN(lng)) {
          return reply.status(400).send({
            success: false,
            error: 'Query parameters lat and lng are required and must be numbers.',
            code: 'INVALID_LOCATION',
          });
        }

        const radiusKm = query.radiusKm ? parseFloat(query.radiusKm) : 25;
        const doctorType = query.doctorType as DoctorType | undefined;
        const language = query.language;

        const validDoctorTypes = ['GP', 'SPECIALIST', 'ALLIED_HEALTH', 'TRAVELLING'];
        if (doctorType && !validDoctorTypes.includes(doctorType)) {
          return reply.status(400).send({
            success: false,
            error: `Invalid doctorType. Must be one of: ${validDoctorTypes.join(', ')}`,
            code: 'INVALID_DOCTOR_TYPE',
          });
        }

        const doctors = await findNearbyDoctors(
          { lat, lng },
          radiusKm,
          doctorType,
          language
        );

        return reply.send({
          success: true,
          data: { doctors, count: doctors.length },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctors/nearby error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // PUT /doctors/availability
  fastify.put(
    '/doctors/availability',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = AvailabilitySchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { isAvailable, lat, lng, radius } = parsed.data;

        // If going available, lat and lng are required
        if (isAvailable && (lat === undefined || lng === undefined)) {
          return reply.status(400).send({
            success: false,
            error: 'lat and lng are required when setting isAvailable to true.',
            code: 'LOCATION_REQUIRED',
          });
        }

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        // Use current location if going offline and no coords given
        const effectiveLat = lat ?? doctor.currentLat ?? 0;
        const effectiveLng = lng ?? doctor.currentLng ?? 0;

        await updateDoctorLocation(
          doctor.id,
          { lat: effectiveLat, lng: effectiveLng },
          isAvailable
        );

        // Update availabilityRadius if provided
        if (radius !== undefined) {
          await prisma.doctor.update({
            where: { id: doctor.id },
            data: { availabilityRadius: radius },
          });
        }

        await auditLog({
          userId,
          action: isAvailable ? 'DOCTOR_AVAILABLE' : 'DOCTOR_UNAVAILABLE',
          resource: 'Doctor',
          resourceId: doctor.id,
          metadata: { lat: effectiveLat, lng: effectiveLng, isAvailable },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            doctorId: doctor.id,
            isAvailable,
            lat: effectiveLat,
            lng: effectiveLng,
            availabilityRadius: radius ?? doctor.availabilityRadius,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'PUT /doctors/availability error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /doctors/:id/profile
  fastify.get(
    '/doctors/:id/profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const doctor = await prisma.doctor.findUnique({
          where: { id },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        // Return public-safe profile — no location data
        return reply.send({
          success: true,
          data: {
            id: doctor.id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            doctorType: doctor.doctorType,
            specialization: doctor.specialization,
            rating: doctor.rating,
            totalReviews: doctor.totalReviews,
            consultationFee: doctor.consultationFee,
            bio: doctor.bio,
            languages: doctor.languages,
            isAvailable: doctor.isAvailable,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctors/:id/profile error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // GET /doctors/me/patient-queue
  fastify.get(
    '/doctors/me/patient-queue',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const doctor = await prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        const consultations = await prisma.consultation.findMany({
          where: {
            status: { in: ['HISTORY_TAKING', 'DOCTOR_REVIEW'] },
            OR: [{ doctorId: doctor.id }, { doctorId: null }],
          },
          orderBy: { startedAt: 'asc' },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            medicalHistory: {
              select: {
                chiefComplaint: true,
              },
            },
          },
        });

        const now = Date.now();

        const queue = consultations.map((c) => {
          // Privacy: first name + last initial + "."
          const patientName = `${c.patient.firstName} ${c.patient.lastName.charAt(0)}.`;

          // Decrypt chief complaint and truncate to a snippet
          let chiefComplaintSnippet = '';
          if (c.medicalHistory?.chiefComplaint) {
            try {
              const dataKey = undefined; // no dataKey needed here since we just get a snippet safely
              // We can't decrypt without the data key at this level — return redacted
              chiefComplaintSnippet = '[Encrypted — open consultation to view]';
            } catch {
              chiefComplaintSnippet = '';
            }
          }

          // Wait time in minutes since consultation started
          const waitTimeMinutes = Math.floor(
            (now - new Date(c.startedAt).getTime()) / 60000
          );

          // Distance calculation if doctor has a location
          let distanceKm: number | null = null;
          if (doctor.currentLat !== null && doctor.currentLng !== null) {
            // Distance to patient is not stored at consultation level;
            // leave null unless patient location data is available in the future
            distanceKm = null;
          }

          return {
            consultationId: c.id,
            patientName,
            consultationType: c.consultationType,
            status: c.status,
            startedAt: c.startedAt,
            waitTimeMinutes,
            chiefComplaintSnippet,
            distanceKm,
            isAssignedToMe: c.doctorId === doctor.id,
          };
        });

        return reply.send({
          success: true,
          data: { queue, count: queue.length },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /doctors/me/patient-queue error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /doctors/me/accept-patient
  fastify.post(
    '/doctors/me/accept-patient',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = AcceptPatientSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { consultationId } = parsed.data;

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
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'CONSULTATION_NOT_FOUND',
          });
        }

        if (
          consultation.doctorId !== null &&
          consultation.doctorId !== doctor.id
        ) {
          return reply.status(409).send({
            success: false,
            error: 'This consultation has already been accepted by another doctor.',
            code: 'CONSULTATION_ALREADY_ASSIGNED',
          });
        }

        const updated = await prisma.consultation.update({
          where: { id: consultationId },
          data: {
            doctorId: doctor.id,
            status: 'DOCTOR_REVIEW',
          },
        });

        await auditLog({
          userId,
          action: 'DOCTOR_ACCEPT_PATIENT',
          resource: 'Consultation',
          resourceId: consultationId,
          metadata: { doctorId: doctor.id, patientId: updated.patientId },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            consultationId: updated.id,
            status: updated.status,
            doctorId: updated.doctorId,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /doctors/me/accept-patient error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // POST /doctors/me/decline-patient
  fastify.post(
    '/doctors/me/decline-patient',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = DeclinePatientSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { consultationId } = parsed.data;

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
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'CONSULTATION_NOT_FOUND',
          });
        }

        // Only clear doctorId if this doctor was the assigned one
        if (consultation.doctorId !== doctor.id) {
          return reply.status(403).send({
            success: false,
            error: 'You are not the assigned doctor for this consultation.',
            code: 'NOT_ASSIGNED',
          });
        }

        const updated = await prisma.consultation.update({
          where: { id: consultationId },
          data: {
            doctorId: null,
            status: 'HISTORY_TAKING',
          },
        });

        await auditLog({
          userId,
          action: 'DOCTOR_DECLINE_PATIENT',
          resource: 'Consultation',
          resourceId: consultationId,
          metadata: { doctorId: doctor.id, patientId: updated.patientId },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            consultationId: updated.id,
            status: updated.status,
            doctorId: updated.doctorId,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /doctors/me/decline-patient error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
