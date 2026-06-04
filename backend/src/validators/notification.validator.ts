import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  message: z.string().min(1),
  entityId: z.string().uuid().optional().nullable(),
});
