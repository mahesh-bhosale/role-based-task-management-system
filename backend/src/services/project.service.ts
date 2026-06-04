import { Prisma, ProjectStatus, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';

export class ProjectService {
  async list(
    pagination: PaginationParams,
    filters: { status?: ProjectStatus; search?: string },
    userId: string,
    role: Role
  ): Promise<PaginatedResult<unknown>> {
    const andFilters: Prisma.ProjectWhereInput[] = [{ deletedAt: null }];

    if (filters.status) {
      andFilters.push({ status: filters.status });
    }

    if (filters.search) {
      andFilters.push({
        OR: [
          { name: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      });
    }

    if (role === Role.EMPLOYEE) {
      andFilters.push({
        OR: [
          { tasks: { some: { assignments: { some: { userId } }, deletedAt: null } } },
          { managerId: userId },
          { createdById: userId },
        ],
      });
    } else if (role === Role.PROJECT_MANAGER) {
      andFilters.push({
        OR: [{ managerId: userId }, { createdById: userId }],
      });
    }

    const where: Prisma.ProjectWhereInput = { AND: andFilters };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
      }),
      prisma.project.count({ where }),
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

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    if (role === Role.EMPLOYEE) {
      const hasAccess =
        project.managerId === userId ||
        project.createdById === userId ||
        project.tasks.some((t) => t.assignments.some((a) => a.userId === userId));
      if (!hasAccess) {
        throw new AppError(403, 'Access denied');
      }
    }

    return project;
  }

  async create(
    data: {
      name: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      status?: ProjectStatus;
      managerId?: string | null;
    },
    createdById: string
  ) {
    if (data.managerId) {
      const manager = await prisma.user.findUnique({ where: { id: data.managerId } });
      if (!manager) {
        throw new AppError(400, 'Manager not found');
      }
    }

    return prisma.project.create({
      data: {
        ...data,
        createdById,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError(404, 'Project not found');
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async softDelete(id: string) {
    const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError(404, 'Project not found');
    }

    return prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const projectService = new ProjectService();
