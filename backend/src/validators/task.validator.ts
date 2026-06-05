import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  priority: z.nativeEnum(TaskPriority),
  deadline: z.coerce.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  assignedToUserId: z.string().uuid().optional(),
});

export const updateTaskSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    deadline: z.coerce.date().optional().nullable(),
    estimatedHours: z.number().min(0).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const taskIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.preprocess((val) => val === '' ? undefined : val, z.nativeEnum(TaskStatus).optional()),
  priority: z.preprocess((val) => val === '' ? undefined : val, z.nativeEnum(TaskPriority).optional()),
  assignedUserId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  deadlineBefore: z.coerce.date().optional(),
  deadlineAfter: z.coerce.date().optional(),
  search: z.string().optional(),
  assigneeName: z.string().optional(),
});