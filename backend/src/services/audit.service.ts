import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

export class AuditService {
  async list(
    pagination: PaginationParams,
    filters: {
      userId?: string;
      entity?: string;
      action?: string;
      entityId?: string;
      from?: Date;
      to?: Date;
    },
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    if (role !== Role.ADMIN) {
      throw new AppError(403, 'Only administrators can view audit logs');
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.entity && { entity: filters.entity }),
      ...(filters.action && { action: filters.action }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

export const auditService = new AuditService();
