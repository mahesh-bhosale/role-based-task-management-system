import { Router } from 'express';
import { Role } from '@prisma/client';
import { auditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { listAuditLogsQuerySchema } from '../validators/audit.validator';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get(
  '/',
  validate(listAuditLogsQuerySchema, 'query'),
  auditController.list.bind(auditController)
);

export default router;
