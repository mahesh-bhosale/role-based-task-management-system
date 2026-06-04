import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

export class NotificationService {
  async list(
    pagination: PaginationParams,
    filters: { status?: string; type?: string },
    userId: string,
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.NotificationWhereInput = {
      ...(role !== Role.ADMIN && { userId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.notification.count({ where }),
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

  async getById(id: string, userId: string, role: Role) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new AppError(404, 'Notification not found');
    }
    if (role !== Role.ADMIN && notification.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }
    return notification;
  }

  async create(data: {
    userId: string;
    type: string;
    message: string;
    entityId?: string | null;
  }) {
    return prisma.notification.create({ data });
  }

  async markAsRead(id: string, userId: string, role: Role) {
    const notification = await this.getById(id, userId, role);
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'read' },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, status: 'sent' },
      data: { status: 'read' },
    });
    return { message: 'All notifications marked as read' };
  }
}

export const notificationService = new NotificationService();
