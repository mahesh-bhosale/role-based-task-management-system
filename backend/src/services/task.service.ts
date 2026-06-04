import { Prisma, Role, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';
import { notificationService } from './notification.service';

export class TaskService {
  async list(
    pagination: PaginationParams,
    filters: {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      search?: string;
    },
    userId: string,
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      }),
      project: { deletedAt: null },
    };

    if (role === Role.EMPLOYEE) {
      where.assignments = { some: { userId } };
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
      prisma.task.count({ where }),
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
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null, project: { deletedAt: null } },
      include: {
        project: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        workLogs: {
          include: {
            user: { select: { id: true, name: true } },
            replies: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    if (
      role === Role.EMPLOYEE &&
      !task.assignments.some((a) => a.userId === userId)
    ) {
      throw new AppError(403, 'Access denied');
    }

    return task;
  }

  async create(
    data: {
      name: string;
      description?: string;
      priority: TaskPriority;
      status?: TaskStatus;
      deadline?: Date;
      estimatedHours?: number;
      projectId: string;
      assigneeIds?: string[];
    },
    createdById: string
  ) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, deletedAt: null },
    });
    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const { assigneeIds, ...taskData } = data;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        createdById,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (assigneeIds?.length) {
      await this.assignUsers(task.id, assigneeIds, createdById);
      return prisma.task.findUnique({
        where: { id: task.id },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    }

    return task;
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    const existing = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError(404, 'Task not found');
    }

    return prisma.task.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }

  async softDelete(id: string) {
    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError(404, 'Task not found');
    }

    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignUsers(taskId: string, userIds: string[], assignedById: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
    });
    if (users.length !== userIds.length) {
      throw new AppError(400, 'One or more users not found');
    }

    for (const userId of userIds) {
      await prisma.taskAssignment.upsert({
        where: { taskId_userId: { taskId, userId } },
        create: { taskId, userId, assignedById },
        update: { assignedById, assignedAt: new Date() },
      });

      await notificationService.create({
        userId,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task: ${task.name}`,
        entityId: taskId,
      });
    }

    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
  }
}

export const taskService = new TaskService();
