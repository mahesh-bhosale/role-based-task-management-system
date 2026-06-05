import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';
import { emitToUser } from '../socket';

export class NotificationService {
  /** GET /api/notifications — always returns the current user's own notifications,
   *  ordered newest first. Admin may also pass a userId filter to see any user's. */
  async list(
    pagination: PaginationParams,
    filters: { status?: string; type?: string; isRead?: boolean },
    userId: string,
    _role: Role
  ): Promise<PaginatedResult<unknown>> {
    // All users see only their own; admin can additionally filter by userId via service
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.isRead !== undefined && { isRead: filters.isRead }),
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
    const notification = await prisma.notification.create({ data });
    
    // Emit real-time event to the user
    emitToUser(data.userId, 'new_notification', notification);
    
    return notification;
  }

  /** PATCH /api/notifications/:id/read — marks isRead=true and status='read' */
  async markAsRead(id: string, userId: string, role: Role) {
    const notification = await this.getById(id, userId, role);
    return prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true, status: 'read' },
    });
  }

  /** PATCH /api/notifications/read-all — marks all current user's unread as read */
  async markAllAsRead(userId: string) {
    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, status: 'read' },
    });
    return { updated: count, message: 'All notifications marked as read' };
  }

  /** Count unread notifications for a user (for badge counts) */
  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }
}

export const notificationService = new NotificationService();
