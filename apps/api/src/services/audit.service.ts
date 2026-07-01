import prisma from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

interface AuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry (fire-and-forget safe — errors are swallowed to
 * avoid disrupting the main request flow).
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    // Never let audit failures break the main flow
    console.error('[AuditLog] Failed to write audit log:', err);
  }
}
