import { z } from 'zod';

// ── Param schemas ─────────────────────────────────────────────────────────────

export const projectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

// ── Legacy query schemas (kept for backward-compat) ───────────────────────────

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
