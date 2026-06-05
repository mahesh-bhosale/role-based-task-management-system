import { Prisma, Role, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';
import { notificationService } from './notification.service';

function toJsonValue(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string;
  assigneeName?: string;
  projectId?: string;
  deadlineBefore?: Date;
  deadlineAfter?: Date;
  search?: string;
}

export interface CreateTaskDto {
  name: string;
  description?: string;
  projectId: string;
  priority: TaskPriority;
  deadline?: Date;
  estimatedHours?: number;
  assignedToUserId?: string;
}

export interface UpdateTaskDto {
  name?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: Date | null;
  estimatedHours?: number | null;
}

type AuthContext = { id: string; role: Role };

const TASK_AUDIT_FIELDS = [
  'name',
  'description',
  'priority',
  'status',
  'deadline',
  'estimatedHours',
  'projectId',
] as const;

function pickAuditFields(
  record: Record<string, unknown>,
  fields: readonly string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in record) {
      result[field] = record[field];
    }
  }
  return result;
}

function getChangedFields(
  previous: Record<string, unknown>,
  updated: Record<string, unknown>,
  fields: readonly string[]
): { previousValue: Record<string, unknown>; newValue: Record<string, unknown> } {
  const previousValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};

  for (const field of fields) {
    const prev = previous[field];
    const next = updated[field];
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      previousValue[field] = prev;
      newValue[field] = next;
    }
  }

  return { previousValue, newValue };
}

export class TaskService {
  private async getProjectOrThrow(projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    if (!project) throw new AppError(404, 'Project not found');
    return project;
  }

  private assertPmOwnsProject(project: { managerId: string | null }, userId: string) {
    if (project.managerId !== userId) {
      throw new AppError(403, 'You do not have permission to manage tasks in this project');
    }
  }

  private async assertTaskManagementAccess(task: { projectId: string }, user: AuthContext) {
    if (user.role === Role.ADMIN) return;

    if (user.role === Role.PROJECT_MANAGER) {
      const project = await this.getProjectOrThrow(task.projectId);
      this.assertPmOwnsProject(project, user.id);
      return;
    }

    throw new AppError(403, 'You do not have permission to perform this action');
  }

  private async assertTaskReadAccess(
    task: { projectId: string; assignments: { userId: string }[] },
    user: AuthContext
  ) {
    if (user.role === Role.ADMIN) return;

    if (user.role === Role.PROJECT_MANAGER) {
      const project = await this.getProjectOrThrow(task.projectId);
      this.assertPmOwnsProject(project, user.id);
      return;
    }

    if (user.role === Role.EMPLOYEE) {
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) {
        throw new AppError(403, 'You do not have permission to view this task');
      }
      return;
    }

    throw new AppError(403, 'Access denied');
  }

  private buildWhereClause(filters: TaskFilters, user: AuthContext): Prisma.TaskWhereInput {
    const andFilters: Prisma.TaskWhereInput[] = [
      { deletedAt: null },
      { project: { deletedAt: null } },
    ];

    if (filters.projectId) andFilters.push({ projectId: filters.projectId });
    if (filters.status) andFilters.push({ status: filters.status });
    if (filters.priority) andFilters.push({ priority: filters.priority });
    if (filters.assignedUserId) {
      andFilters.push({ assignments: { some: { userId: filters.assignedUserId } } });
    }
    if (filters.deadlineBefore) andFilters.push({ deadline: { lte: filters.deadlineBefore } });
    if (filters.deadlineAfter) andFilters.push({ deadline: { gte: filters.deadlineAfter } });
    if (filters.search) {
      andFilters.push({
        OR: [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      });
    }
    if (filters.assigneeName) {
      andFilters.push({ assignments: { some: { user: { name: { contains: filters.assigneeName } } } } });
    }

    if (user.role === Role.EMPLOYEE) {
      andFilters.push({ assignments: { some: { userId: user.id } } });
    } else if (user.role === Role.PROJECT_MANAGER) {
      andFilters.push({ project: { managerId: user.id, deletedAt: null } });
    }

    return { AND: andFilters };
  }

  async getTasks(
    filters: TaskFilters,
    pagination: PaginationParams,
    user: AuthContext
  ): Promise<PaginatedResult<unknown>> {
    const where = this.buildWhereClause(filters, user);

    const [data, total] = await Promise.all([
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
      items: data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getTaskById(id: string, user: AuthContext) {
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null, project: { deletedAt: null } },
      include: {
        project: { select: { id: true, name: true, status: true, managerId: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { workLogs: true } },
      },
    });

    if (!task) throw new AppError(404, 'Task not found');

    await this.assertTaskReadAccess(task, user);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: 'TASK', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const { _count, ...rest } = task;
    return { ...rest, workLogsCount: _count.workLogs, auditLogs };
  }

  async createTask(dto: CreateTaskDto, user: AuthContext, ipAddress?: string) {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError(403, 'Employees cannot create tasks');
    }

    const project = await this.getProjectOrThrow(dto.projectId);

    if (user.role === Role.PROJECT_MANAGER) {
      this.assertPmOwnsProject(project, user.id);
    }

    if (dto.assignedToUserId) {
      const assignee = await prisma.user.findFirst({
        where: { id: dto.assignedToUserId, isActive: true },
      });
      if (!assignee) throw new AppError(400, 'Assigned user not found');
    }

    const { assignedToUserId, ...taskData } = dto;

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: { ...taskData, createdById: user.id },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      if (assignedToUserId) {
        await tx.taskAssignment.create({
          data: { taskId: task.id, userId: assignedToUserId, assignedById: user.id },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entity: 'TASK',
          entityId: task.id,
          previousValue: Prisma.JsonNull,
          newValue: toJsonValue({
            ...pickAuditFields(task as unknown as Record<string, unknown>, TASK_AUDIT_FIELDS),
            assignedToUserId: assignedToUserId ?? null,
          }),
          ipAddress: ipAddress ?? null,
        },
      });

      if (assignedToUserId) {
        await notificationService.create({
          userId: assignedToUserId,
          type: 'TASK_ASSIGNED',
          message: `You have been assigned to task: ${task.name}`,
          entityId: task.id,
        });
      }

      return tx.task.findUnique({
        where: { id: task.id },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    }, { maxWait: 5000, timeout: 20000 });
  }

  async updateTask(id: string, dto: UpdateTaskDto, user: AuthContext, ipAddress?: string) {
    const existing = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignments: { select: { userId: true } } },
    });

    if (!existing) throw new AppError(404, 'Task not found');

    if (user.role === Role.EMPLOYEE) {
      const isAssigned = existing.assignments.some((a) => a.userId === user.id);
      if (!isAssigned) throw new AppError(403, 'You do not have permission to update this task');

      const allowedKeys = Object.keys(dto);
      if (allowedKeys.length !== 1 || !('status' in dto)) {
        throw new AppError(403, 'Employees can only update task status');
      }
    } else {
      await this.assertTaskManagementAccess(existing, user);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: dto,
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      const { previousValue, newValue } = getChangedFields(
        pickAuditFields(existing as unknown as Record<string, unknown>, TASK_AUDIT_FIELDS),
        pickAuditFields(updated as unknown as Record<string, unknown>, TASK_AUDIT_FIELDS),
        TASK_AUDIT_FIELDS
      );

      if (Object.keys(newValue).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            entity: 'TASK',
            entityId: id,
            previousValue: toJsonValue(previousValue),
            newValue: toJsonValue(newValue),
            ipAddress: ipAddress ?? null,
          },
        });
      }

      return updated;
    }, { maxWait: 5000, timeout: 20000 });
  }

  async deleteTask(id: string, user: AuthContext, ipAddress?: string) {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError(403, 'Employees cannot delete tasks');
    }

    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'Task not found');

    await this.assertTaskManagementAccess(existing, user);

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.task.update({
        where: { id },
        data: { deletedAt: now },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          entity: 'TASK',
          entityId: id,
          previousValue: toJsonValue(
            pickAuditFields(existing as unknown as Record<string, unknown>, TASK_AUDIT_FIELDS)
          ),
          newValue: toJsonValue({ deletedAt: now }),
          ipAddress: ipAddress ?? null,
        },
      });

      return deleted;
    }, { maxWait: 5000, timeout: 20000 });
  }

  async assignTask(id: string, userId: string, user: AuthContext, ipAddress?: string) {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError(403, 'Employees cannot assign tasks');
    }

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!task) throw new AppError(404, 'Task not found');

    await this.assertTaskManagementAccess(task, user);

    const assignee = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
    });
    if (!assignee) throw new AppError(400, 'User not found');

    const previousAssignments = task.assignments.map((a) => ({
      userId: a.userId,
      userName: a.user.name,
    }));

    return prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({
        where: { taskId: id, userId: { not: userId } },
      });

      await tx.taskAssignment.upsert({
        where: { taskId_userId: { taskId: id, userId } },
        create: { taskId: id, userId, assignedById: user.id },
        update: { assignedById: user.id, assignedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ASSIGN',
          entity: 'TASK',
          entityId: id,
          previousValue: toJsonValue({ assignments: previousAssignments }),
          newValue: toJsonValue({ userId, userName: assignee.name }),
          ipAddress: ipAddress ?? null,
        },
      });

      const updated = await tx.task.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      await notificationService.create({
        userId,
        type: 'TASK_ASSIGNED',
        message: `You have been assigned to task: ${task.name}`,
        entityId: id,
      });

      return updated;
    }, { maxWait: 5000, timeout: 20000 });
  }

  async unassignTask(id: string, user: AuthContext, ipAddress?: string) {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError(403, 'Employees cannot unassign tasks');
    }

    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!task) throw new AppError(404, 'Task not found');
    await this.assertTaskManagementAccess(task, user);

    const previousAssignments = task.assignments.map((a) => ({
      userId: a.userId,
      userName: a.user.name,
    }));

    if (previousAssignments.length === 0) return task;

    return prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({
        where: { taskId: id },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ASSIGN',
          entity: 'TASK',
          entityId: id,
          previousValue: toJsonValue({ assignments: previousAssignments }),
          newValue: toJsonValue({ status: 'unassigned' }),
          ipAddress: ipAddress ?? null,
        },
      });

      return tx.task.findUnique({
        where: { id },
        include: {
          project: { select: { id: true, name: true } },
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    }, { maxWait: 5000, timeout: 20000 });
  }

  async getTaskHistory(id: string, user: AuthContext) {
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: { assignments: { select: { userId: true } } },
    });

    if (!task) throw new AppError(404, 'Task not found');

    await this.assertTaskReadAccess(task, user);

    return prisma.auditLog.findMany({
      where: { entity: 'TASK', entityId: id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async getProjectTasks(
    projectId: string,
    filters: Omit<TaskFilters, 'projectId'>,
    pagination: PaginationParams,
    user: AuthContext
  ): Promise<PaginatedListResult<unknown>> {
    if (user.role === Role.EMPLOYEE) {
      throw new AppError(403, 'You do not have permission to access project tasks');
    }

    const project = await this.getProjectOrThrow(projectId);

    if (user.role === Role.PROJECT_MANAGER) {
      this.assertPmOwnsProject(project, user.id);
    }

    return this.getTasks({ ...filters, projectId }, pagination, user);
  }
}

export const taskService = new TaskService();