import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';

// ============================================================
// Schemas
// ============================================================

const RegisterTokenSchema = z.object({
  token: z.string().min(1).max(200),
});

// ============================================================
// Route plugin
// ============================================================

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /notifications/register-token
  fastify.post(
    '/notifications/register-token',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = RegisterTokenSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { token } = parsed.data;

        // Validate token format — Expo tokens start with ExponentPushToken[
        // Also allow bare device tokens (FCM/APNs) in some SDK versions
        if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
          return reply.status(400).send({
            success: false,
            error: 'Invalid push token format. Expected an Expo push token.',
            code: 'INVALID_TOKEN_FORMAT',
          });
        }

        await prisma.user.update({
          where: { id: userId },
          data: { pushToken: token },
        });

        return reply.send({ success: true });
      } catch (err) {
        fastify.log.error(err, 'POST /notifications/register-token error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // DELETE /notifications/token
  fastify.delete(
    '/notifications/token',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        await prisma.user.update({
          where: { id: userId },
          data: { pushToken: null },
        });

        return reply.send({ success: true });
      } catch (err) {
        fastify.log.error(err, 'DELETE /notifications/token error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
