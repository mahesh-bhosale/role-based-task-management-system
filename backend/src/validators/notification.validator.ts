import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  isRead: z.enum(['true', 'false']).optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  message: z.string().min(1),
  entityId: z.string().uuid().optional().nullable(),
});
