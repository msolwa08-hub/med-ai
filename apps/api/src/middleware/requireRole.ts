import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Factory for role-based access control preHandler.
 * Must be used after `authenticate`.
 *
 * For DOCTOR role, also enforces HPCSA verification status.
 */
export function requireRole(...roles: UserRole[]) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
        code: 'FORBIDDEN',
      });
    }

    // Extra check for doctors: HPCSA must be verified
    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: user.sub },
        select: { hpcsaStatus: true },
      });

      if (!doctor) {
        return reply.status(403).send({
          success: false,
          error: 'Doctor profile not found.',
          code: 'DOCTOR_NOT_FOUND',
        });
      }

      if (doctor.hpcsaStatus !== 'VERIFIED') {
        return reply.status(403).send({
          success: false,
          error:
            'Your HPCSA registration is not yet verified. You cannot access patient data until verification is complete.',
          code: 'HPCSA_NOT_VERIFIED',
        });
      }
    }
  };
}

/**
 * Allow the resource owner (patient themselves) OR doctors/admins.
 * Useful for routes like GET /patients/me.
 */
export function requireOwnerOrRole(
  getOwnerId: (req: FastifyRequest) => string | undefined,
  ...roles: UserRole[]
) {
  return async function (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    const ownerId = getOwnerId(request);
    const isOwner = ownerId === user.sub;
    const hasRole = roles.includes(user.role);

    if (!isOwner && !hasRole) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied.',
        code: 'FORBIDDEN',
      });
    }
  };
}
