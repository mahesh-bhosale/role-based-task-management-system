import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/hash';

const userSelectPublic = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  async list(
    pagination: PaginationParams,
    filters: { role?: Role; isActive?: boolean }
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.UserWhereInput = {};
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        select: {
          ...userSelectPublic,
          _count: {
            select: { taskAssignments: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Flatten _count into a taskCount field for cleaner response
    const data = (items as Array<typeof items[number] & { _count?: { taskAssignments: number } }>).map((u) => {
      const { _count, ...rest } = u as typeof u & { _count: { taskAssignments: number } };
      return { ...rest, taskCount: _count?.taskAssignments ?? 0 };
    });

    return {
      items: data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelectPublic,
        taskAssignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            task: {
              select: {
                id: true,
                name: true,
                status: true,
                priority: true,
                deadline: true,
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
        workLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            description: true,
            hoursWorked: true,
            createdAt: true,
            task: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user) {
      throw new AppError(404, 'User not found');
    }
    return user;
  }

  async create(data: { name: string; email: string; password: string; role?: Role }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const hashed = await hashPassword(data.password);
    return prisma.user.create({
      data: { ...data, password: hashed },
      select: userSelectPublic,
    });
  }

  async update(
    id: string,
    data: { name?: string; email?: string; role?: Role; isActive?: boolean }
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        throw new AppError(409, 'Email already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: userSelectPublic,
    });
  }

  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelectPublic,
    });
  }
}

export const userService = new UserService();
