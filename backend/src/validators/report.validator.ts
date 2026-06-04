import { z } from 'zod';

export const projectReportQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const userReportQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const taskReportQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.string().optional(),
});
