import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, PaginatedResult } from '../types/shared';
import { PaginationParams } from '../utils/pagination';
import { hashPassword } from '../utils/hash';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export class UserService {
  async list(pagination: PaginationParams): Promise<PaginatedResult<unknown>> {
    const where = { isActive: true };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        select: userSelect,
      }),
      prisma.user.count({ where }),
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

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
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
      select: userSelect,
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
      select: userSelect,
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
      select: userSelect,
    });
  }
}

export const userService = new UserService();
