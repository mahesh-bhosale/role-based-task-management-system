import { z } from 'zod';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  userId: z.string().uuid().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  entityId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
