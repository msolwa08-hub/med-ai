import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { uploadProfilePhoto, getProfilePhotoUrl } from '../services/upload.service.js';

// ============================================================
// Schemas
// ============================================================

const UploadPhotoSchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/jpg']).default('image/jpeg'),
});

// ============================================================
// Route plugin
// ============================================================

export async function uploadRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /upload/profile-photo
   *
   * Body: { imageBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/jpg' }
   *
   * Accepts a base64-encoded image, uploads to S3, and updates the
   * caller's Doctor.profilePhoto (or Patient.profilePhoto when supported).
   */
  fastify.post(
    '/upload/profile-photo',
    // base64 inflates ~4/3, so a 5 MB image needs ~7 MB of JSON body
    { preHandler: [authenticate], bodyLimit: 10 * 1024 * 1024 },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;
        const role = request.user!.role;

        const parsed = UploadPhotoSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { imageBase64, mimeType } = parsed.data;

        // Decode base64 → Buffer and enforce 5 MB size limit
        const fileBuffer = Buffer.from(imageBase64, 'base64');
        const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
        if (fileBuffer.byteLength > MAX_BYTES) {
          return reply.status(400).send({
            success: false,
            error: 'Image exceeds the 5 MB size limit.',
            code: 'FILE_TOO_LARGE',
          });
        }

        // Upload to S3 — returns the object key
        const key = await uploadProfilePhoto(fileBuffer, mimeType, userId);

        // Persist the key on the relevant profile record
        if (role === 'DOCTOR') {
          await prisma.doctor.update({
            where: { userId },
            data: { profilePhoto: key },
          });
        }
        // Patient model currently has no profilePhoto column; skip silently.

        const url = getProfilePhotoUrl(key);

        return reply.send({
          success: true,
          data: { key, url },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /upload/profile-photo error');
        return reply.status(500).send({
          success: false,
          error: 'Failed to upload photo. Please try again.',
        });
      }
    }
  );
}
