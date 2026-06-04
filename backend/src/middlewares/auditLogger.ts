import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export async function createAuditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  previousValue: Prisma.InputJsonValue | null = null,
  newValue: Prisma.InputJsonValue | null = null,
  ipAddress?: string | null
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      previousValue: previousValue === null ? Prisma.DbNull : previousValue,
      newValue: newValue === null ? Prisma.DbNull : newValue,
      ipAddress: ipAddress ?? null,
    },
  });
}
