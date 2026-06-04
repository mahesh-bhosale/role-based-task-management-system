import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a task and verify the requesting user may access it. */
async function assertTaskAccess(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      assignments: true,
      project: { select: { id: true, managerId: true } },
    },
  });
  if (!task) {
    throw new AppError(404, 'Task not found');
  }
  if (role === Role.EMPLOYEE && !task.assignments.some((a) => a.userId === userId)) {
    throw new AppError(403, 'You are not assigned to this task');
  }
  return task;
}

/** Verify a worklog exists and the requester may read it. */
async function assertWorkLogReadAccess(id: string, userId: string, role: Role) {
  const wl = await prisma.workLog.findUnique({
    where: { id },
    include: {
      task: {
        select: {
          id: true,
          projectId: true,
          project: { select: { managerId: true } },
          assignments: { select: { userId: true } },
        },
      },
    },
  });

  if (!wl) throw new AppError(404, 'Work log not found');

  if (role === Role.EMPLOYEE && wl.userId !== userId) {
    throw new AppError(403, 'Access denied');
  }
  if (
    role === Role.PROJECT_MANAGER &&
    wl.task.project.managerId !== userId
  ) {
    throw new AppError(403, 'Access denied');
  }

  return wl;
}

// ── WorkLog Service ───────────────────────────────────────────────────────────

export class WorkLogService {
  // ── POST /api/tasks/:taskId/worklogs ───────────────────────────────────────
  async createForTask(
    taskId: string,
    data: { description: string; hoursWorked: number },
    attachmentUrl: string | null,
    userId: string,
    role: Role
  ) {
    if (role !== Role.EMPLOYEE) {
      throw new AppError(403, 'Only employees can submit work logs');
    }
    await assertTaskAccess(taskId, userId, role);

    return prisma.workLog.create({
      data: {
        description: data.description,
        hoursWorked: data.hoursWorked,
        attachmentUrl,
        taskId,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, name: true } },
      },
    });
  }

  // ── GET /api/tasks/:taskId/worklogs ────────────────────────────────────────
  async listForTask(
    taskId: string,
    pagination: PaginationParams,
    requesterId: string,
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        project: { select: { managerId: true } },
        assignments: { select: { userId: true } },
      },
    });

    if (!task) throw new AppError(404, 'Task not found');

    // RBAC gate
    if (
      role === Role.EMPLOYEE &&
      !task.assignments.some((a) => a.userId === requesterId)
    ) {
      throw new AppError(403, 'You are not assigned to this task');
    }
    if (
      role === Role.PROJECT_MANAGER &&
      task.project.managerId !== requesterId
    ) {
      throw new AppError(403, 'Access denied');
    }

    const where: Prisma.WorkLogWhereInput = { taskId };
    if (role === Role.EMPLOYEE) where.userId = requesterId;

    const [items, total] = await Promise.all([
      prisma.workLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { replies: true } },
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

  // ── GET /api/worklogs ──────────────────────────────────────────────────────
  async list(
    pagination: PaginationParams,
    filters: {
      userId?: string;
      projectId?: string;
      taskId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    requesterId: string,
    role: Role
  ): Promise<PaginatedResult<unknown> & { meta: { totalHoursWorked: number } }> {
    if (role === Role.EMPLOYEE) {
      throw new AppError(403, 'Employees cannot access the global work log list');
    }

    const where: Prisma.WorkLogWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.taskId) where.taskId = filters.taskId;
    if (filters.projectId) where.task = { projectId: filters.projectId };
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      };
    }

    // PM: only logs for their own projects
    if (role === Role.PROJECT_MANAGER) {
      where.task = {
        ...((where.task as Prisma.TaskWhereInput) ?? {}),
        project: { managerId: requesterId, deletedAt: null },
      };
    }

    const [items, total, aggregate] = await Promise.all([
      prisma.workLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: {
            select: {
              id: true,
              name: true,
              project: { select: { id: true, name: true } },
            },
          },
          _count: { select: { replies: true } },
        },
      }),
      prisma.workLog.count({ where }),
      prisma.workLog.aggregate({ where, _sum: { hoursWorked: true } }),
    ]);

    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        totalHoursWorked: aggregate._sum.hoursWorked ?? 0,
      },
    };
  }

  // ── GET /api/worklogs/:id ─────────────────────────────────────────────────
  async getById(id: string, userId: string, role: Role) {
    await assertWorkLogReadAccess(id, userId, role);

    return prisma.workLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true } },
          },
        },
        replies: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ── POST /api/worklogs/:id/replies ────────────────────────────────────────
  async addReply(
    workLogId: string,
    message: string,
    userId: string,
    role: Role
  ) {
    const wl = await prisma.workLog.findUnique({
      where: { id: workLogId },
      include: {
        task: { select: { project: { select: { managerId: true } } } },
      },
    });
    if (!wl) throw new AppError(404, 'Work log not found');

    if (role === Role.EMPLOYEE) {
      throw new AppError(403, 'Only admins or project managers can reply to work logs');
    }
    if (
      role === Role.PROJECT_MANAGER &&
      wl.task.project.managerId !== userId
    ) {
      throw new AppError(403, 'You can only reply to logs in your own projects');
    }

    return prisma.logReply.create({
      data: { workLogId, message, userId },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // ── GET /api/worklogs/:id/replies ─────────────────────────────────────────
  async getReplies(workLogId: string, userId: string, role: Role) {
    const wl = await prisma.workLog.findUnique({
      where: { id: workLogId },
      include: {
        task: {
          select: {
            project: { select: { managerId: true } },
            assignments: { select: { userId: true } },
          },
        },
      },
    });
    if (!wl) throw new AppError(404, 'Work log not found');

    // RBAC: employee only own logs, PM only project logs, admin all
    if (role === Role.EMPLOYEE && wl.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }
    if (
      role === Role.PROJECT_MANAGER &&
      wl.task.project.managerId !== userId
    ) {
      throw new AppError(403, 'Access denied');
    }

    return prisma.logReply.findMany({
      where: { workLogId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // ── Legacy update / delete (kept for backward compat) ─────────────────────
  async update(
    id: string,
    data: { description?: string; hoursWorked?: number },
    userId: string,
    role: Role
  ) {
    const workLog = await prisma.workLog.findUnique({ where: { id } });
    if (!workLog) throw new AppError(404, 'Work log not found');
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
    if (!workLog) throw new AppError(404, 'Work log not found');
    if (role === Role.EMPLOYEE && workLog.userId !== userId) {
      throw new AppError(403, 'You can only delete your own work logs');
    }
    await prisma.workLog.delete({ where: { id } });
  }
}

export const workLogService = new WorkLogService();
