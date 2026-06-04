import { z } from 'zod';

export const createWorkLogSchema = z.object({
  description: z.string().min(1),
  hoursWorked: z.number().positive(),
  attachmentUrl: z.string().url().optional().nullable(),
  taskId: z.string().uuid(),
});

export const updateWorkLogSchema = z.object({
  description: z.string().min(1).optional(),
  hoursWorked: z.number().positive().optional(),
  attachmentUrl: z.string().url().optional().nullable(),
});

export const createLogReplySchema = z.object({
  message: z.string().min(1),
});

export const workLogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listWorkLogsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  taskId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
