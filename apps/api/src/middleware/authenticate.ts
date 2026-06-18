import type { FastifyRequest, FastifyReply } from 'fastify';
import { isTokenBlacklisted } from '../lib/redis.js';
import type { JwtPayload } from '../types/index.js';

/**
 * Fastify preHandler hook that validates the JWT access token.
 * Sets request.user on success, returns 401 on failure.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify<JwtPayload>();

    // Check if token has been revoked (logout)
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
        return reply.status(401).send({
          success: false,
          error: 'Token has been revoked. Please log in again.',
          code: 'TOKEN_REVOKED',
        });
      }
    }
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized. Invalid or expired token.',
      code: 'UNAUTHORIZED',
    });
  }
}
