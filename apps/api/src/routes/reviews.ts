import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';

// ============================================================
// Schemas
// ============================================================

const CreateReviewSchema = z.object({
  consultationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const ListReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================
// Route plugin
// ============================================================

export async function reviewRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /reviews
  // ----------------------------------------------------------
  fastify.post(
    '/reviews',
    { preHandler: [authenticate] },
    async (request, reply) => {
      // Only patients can leave reviews
      if (request.user!.role !== 'PATIENT') {
        return reply.status(403).send({
          success: false,
          error: 'Only patients can submit reviews.',
          code: 'FORBIDDEN',
        });
      }

      const parsed = CreateReviewSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { consultationId, rating, comment } = parsed.data;
      const userId = request.user!.sub;

      // Get patient record
      const patient = await prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!patient) {
        return reply.status(404).send({ success: false, error: 'Patient profile not found.' });
      }

      // Verify consultation exists and belongs to this patient
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          status: true,
        },
      });

      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      if (consultation.patientId !== patient.id) {
        return reply.status(403).send({
          success: false,
          error: 'You do not own this consultation.',
          code: 'FORBIDDEN',
        });
      }

      if (consultation.status !== 'COMPLETED') {
        return reply.status(400).send({
          success: false,
          error: 'Reviews can only be submitted for completed consultations.',
          code: 'CONSULTATION_NOT_COMPLETED',
        });
      }

      if (!consultation.doctorId) {
        return reply.status(400).send({
          success: false,
          error: 'No doctor is assigned to this consultation.',
        });
      }

      // Check no review already exists for this consultation
      const existingReview = await prisma.review.findFirst({
        where: { patientId: patient.id, consultationId },
      });

      if (existingReview) {
        return reply.status(409).send({
          success: false,
          error: 'You have already submitted a review for this consultation.',
          code: 'REVIEW_EXISTS',
        });
      }

      // Get current doctor rating stats for rolling average update
      const doctor = await prisma.doctor.findUnique({
        where: { id: consultation.doctorId },
        select: { id: true, rating: true, totalReviews: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor not found.' });
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          consultationId,
          rating,
          comment: comment ?? null,
        },
      });

      // Update doctor's rolling average rating
      const newTotalReviews = doctor.totalReviews + 1;
      const newRating =
        (doctor.rating * doctor.totalReviews + rating) / newTotalReviews;
      const newRatingRounded = Math.round(newRating * 10) / 10;

      await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          rating: newRatingRounded,
          totalReviews: newTotalReviews,
        },
      });

      await auditLog({
        userId,
        action: 'SUBMIT_REVIEW',
        resource: 'Review',
        resourceId: review.id,
        metadata: { consultationId, doctorId: doctor.id, rating },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(201).send({
        success: true,
        data: {
          id: review.id,
          consultationId: review.consultationId,
          doctorId: review.doctorId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // GET /reviews/doctor/:doctorId
  // ----------------------------------------------------------
  fastify.get(
    '/reviews/doctor/:doctorId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { doctorId } = request.params as { doctorId: string };
      const queryParsed = ListReviewsQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid query parameters',
          details: queryParsed.error.flatten(),
        });
      }

      const { limit, offset } = queryParsed.data;

      // Verify doctor exists
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true, rating: true, totalReviews: true },
      });

      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor not found.' });
      }

      const reviews = await prisma.review.findMany({
        where: { doctorId },
        include: {
          patient: { select: { firstName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const reviewList = reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        // Only return first name for patient privacy
        patientFirstName: r.patient.firstName,
      }));

      return reply.send({
        success: true,
        data: {
          reviews: reviewList,
          averageRating: doctor.rating,
          totalReviews: doctor.totalReviews,
          limit,
          offset,
        },
      });
    }
  );
}
