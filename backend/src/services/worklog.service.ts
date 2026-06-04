import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

export class WorkLogService {
  private async assertTaskAccess(taskId: string, userId: string, role: Role) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { assignments: true },
    });
    if (!task) {
      throw new AppError(404, 'Task not found');
    }
    if (
      role === Role.EMPLOYEE &&
      !task.assignments.some((a) => a.userId === userId)
    ) {
      throw new AppError(403, 'You are not assigned to this task');
    }
    return task;
  }

  async list(
    pagination: PaginationParams,
    filters: { taskId?: string; userId?: string },
    requesterId: string,
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.WorkLogWhereInput = {
      ...(filters.taskId && { taskId: filters.taskId }),
      ...(filters.userId && { userId: filters.userId }),
    };

    if (role === Role.EMPLOYEE) {
      where.userId = requesterId;
    }

    const [items, total] = await Promise.all([
      prisma.workLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, name: true } },
          replies: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.workLog.count({ where }),
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
    const workLog = await prisma.workLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: true,
        replies: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workLog) {
      throw new AppError(404, 'Work log not found');
    }

    if (role === Role.EMPLOYEE && workLog.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return workLog;
  }

  async create(
    data: {
      description: string;
      hoursWorked: number;
      attachmentUrl?: string | null;
      taskId: string;
    },
    userId: string,
    role: Role
  ) {
    await this.assertTaskAccess(data.taskId, userId, role);

    return prisma.workLog.create({
      data: { ...data, userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    data: { description?: string; hoursWorked?: number; attachmentUrl?: string | null },
    userId: string,
    role: Role
  ) {
    const workLog = await prisma.workLog.findUnique({ where: { id } });
    if (!workLog) {
      throw new AppError(404, 'Work log not found');
    }

    if (role === Role.EMPLOYEE && workLog.userId !== userId) {
      throw new AppError(403, 'You can only update your own work logs');
    }

    return prisma.workLog.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string, userId: string, role: Role) {
    const workLog = await prisma.workLog.findUnique({ where: { id } });
    if (!workLog) {
      throw new AppError(404, 'Work log not found');
    }

    if (role === Role.EMPLOYEE && workLog.userId !== userId) {
      throw new AppError(403, 'You can only delete your own work logs');
    }

    await prisma.workLog.delete({ where: { id } });
  }

  async addReply(workLogId: string, message: string, userId: string) {
    const workLog = await prisma.workLog.findUnique({ where: { id: workLogId } });
    if (!workLog) {
      throw new AppError(404, 'Work log not found');
    }

    return prisma.logReply.create({
      data: { workLogId, message, userId },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}

export const workLogService = new WorkLogService();
