import { Prisma, ProjectStatus, Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

function toJsonValue(
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  managerId?: string;
  managerName?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface CreateProjectDto {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status?: ProjectStatus;
  managerId?: string | null;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ProjectStatus;
  managerId?: string | null;
}

type AuthContext = { id: string; role: Role };

const PROJECT_AUDIT_FIELDS = [
  'name',
  'description',
  'startDate',
  'endDate',
  'status',
  'managerId',
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

function computeCompletionPercentage(tasks: { status: TaskStatus }[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  return Math.round((completed / tasks.length) * 100);
}

function computeProgressStats(tasks: { status: TaskStatus }[]) {
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    pending: tasks.filter(
      (t) => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_REVIEW
    ).length,
  };
}

export class ProjectService {
  private assertNotEmployee(role: Role) {
    if (role === Role.EMPLOYEE) {
      throw new AppError(403, 'You do not have permission to access projects');
    }
  }

  private assertAdmin(role: Role) {
    if (role !== Role.ADMIN) {
      throw new AppError(403, 'Admin access required');
    }
  }

  private assertProjectManager(project: { managerId: string | null }, userId: string) {
    if (project.managerId !== userId) {
      throw new AppError(403, 'You do not have permission to manage this project');
    }
  }

  async getProjects(
    filters: ProjectFilters,
    pagination: PaginationParams,
    user: AuthContext
  ): Promise<PaginatedResult<unknown>> {
    this.assertNotEmployee(user.role);

    const andFilters: Prisma.ProjectWhereInput[] = [{ deletedAt: null }];

    if (filters.status) andFilters.push({ status: filters.status });
    if (filters.managerId) andFilters.push({ managerId: filters.managerId });
    if (filters.startDate) andFilters.push({ startDate: { gte: filters.startDate } });
    if (filters.endDate) andFilters.push({ endDate: { lte: filters.endDate } });
    if (filters.search) {
      andFilters.push({
        OR: [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      });
    }
    if (filters.managerName) {
      andFilters.push({ manager: { name: { contains: filters.managerName } } });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      andFilters.push({ managerId: user.id });
    }

    const where: Prisma.ProjectWhereInput = { AND: andFilters };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          tasks: { where: { deletedAt: null }, select: { status: true } },
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const data = projects.map(({ tasks, ...project }) => ({
      ...project,
      _count: project._count,
      completionPercentage: computeCompletionPercentage(tasks),
    }));

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

  async getProjectById(id: string, user: AuthContext) {
    this.assertNotEmployee(user.role);

    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          where: { deletedAt: null },
          include: {
            assignments: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!project) throw new AppError(404, 'Project not found');

    if (user.role === Role.PROJECT_MANAGER) {
      this.assertProjectManager(project, user.id);
    }

    const { tasks, ...rest } = project;
    return { ...rest, tasks, progress: computeProgressStats(tasks) };
  }

  async createProject(dto: CreateProjectDto, user: AuthContext) {
    this.assertAdmin(user.role);

    if (dto.endDate < dto.startDate) {
      throw new AppError(400, 'End date must be after start date');
    }

    if (dto.managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: dto.managerId, isActive: true },
      });
      if (!manager) throw new AppError(400, 'Manager not found');
    }

    return prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status ?? ProjectStatus.PLANNING,
        managerId: dto.managerId ?? null,
        createdById: user.id,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updateProject(id: string, dto: UpdateProjectDto, user: AuthContext, ipAddress?: string) {
    this.assertNotEmployee(user.role);

    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'Project not found');

    if (user.role === Role.PROJECT_MANAGER) {
      this.assertProjectManager(existing, user.id);
      if ('managerId' in dto) {
        throw new AppError(403, 'Project managers cannot change the project manager');
      }
    }

    const resolvedStart = dto.startDate ?? existing.startDate;
    const resolvedEnd = dto.endDate ?? existing.endDate;
    if (resolvedStart && resolvedEnd && resolvedEnd < resolvedStart) {
      throw new AppError(400, 'End date must be after start date');
    }

    if (dto.managerId && user.role === Role.ADMIN) {
      const manager = await prisma.user.findFirst({
        where: { id: dto.managerId, isActive: true },
      });
      if (!manager) throw new AppError(400, 'Manager not found');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: dto,
        include: {
          manager: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      const { previousValue, newValue } = getChangedFields(
        pickAuditFields(existing as unknown as Record<string, unknown>, PROJECT_AUDIT_FIELDS),
        pickAuditFields(updated as unknown as Record<string, unknown>, PROJECT_AUDIT_FIELDS),
        PROJECT_AUDIT_FIELDS
      );

      if (Object.keys(newValue).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPDATE',
            entity: 'PROJECT',
            entityId: id,
            previousValue: toJsonValue(previousValue),
            newValue: toJsonValue(newValue),
            ipAddress: ipAddress ?? null,
          },
        });
      }

      return updated;
    });
  }

  async deleteProject(id: string, user: AuthContext, ipAddress?: string) {
    this.assertAdmin(user.role);

    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'Project not found');

    const now = new Date();

    return prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { projectId: id, deletedAt: null },
        data: { deletedAt: now },
      });

      const deleted = await tx.project.update({
        where: { id },
        data: { deletedAt: now },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          entity: 'PROJECT',
          entityId: id,
          previousValue: toJsonValue(
            pickAuditFields(existing as unknown as Record<string, unknown>, PROJECT_AUDIT_FIELDS)
          ),
          newValue: toJsonValue({ deletedAt: now }),
          ipAddress: ipAddress ?? null,
        },
      });

      return deleted;
    }, { maxWait: 5000, timeout: 20000 });
  }

  async archiveProject(id: string, user: AuthContext, ipAddress?: string) {
    this.assertNotEmployee(user.role);

    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(404, 'Project not found');

    if (user.role === Role.PROJECT_MANAGER) {
      this.assertProjectManager(existing, user.id);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: { status: ProjectStatus.ARCHIVED },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entity: 'PROJECT',
          entityId: id,
          previousValue: toJsonValue({ status: existing.status }),
          newValue: toJsonValue({ status: ProjectStatus.ARCHIVED }),
          ipAddress: ipAddress ?? null,
        },
      });

      return updated;
    });
  }
}

export const projectService = new ProjectService();