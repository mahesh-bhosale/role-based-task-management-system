import { z } from 'zod';

// ── WorkLog ──────────────────────────────────────────────────────────────────

export const createWorkLogSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hoursWorked: z
    .number({ required_error: 'hoursWorked is required' })
    .positive('hoursWorked must be a positive number'),
  // taskId comes from URL param in the task-nested route; keep it optional here
  // for the flat POST /api/worklogs variant (not used in the spec but harmless)
  taskId: z.string().uuid().optional(),
});

export const updateWorkLogSchema = z.object({
  description: z.string().min(1).optional(),
  hoursWorked: z.number().positive().optional(),
});

// ── LogReply ─────────────────────────────────────────────────────────────────

export const createLogReplySchema = z.object({
  message: z.string().min(1, 'Message is required'),
});

// ── Params ────────────────────────────────────────────────────────────────────

export const workLogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid(),
});

// ── Query filters ─────────────────────────────────────────────────────────────

export const listWorkLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const listTaskWorkLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
