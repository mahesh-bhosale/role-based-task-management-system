import { Router } from 'express';
import { Role } from '@prisma/client';
import { workLogController } from '../controllers/worklog.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  updateWorkLogSchema,
  createLogReplySchema,
  workLogIdParamSchema,
  listWorkLogsQuerySchema,
} from '../validators/worklog.validator';

const router = Router();

router.use(authenticate);

// ── Global worklog list (Admin / PM only) ─────────────────────────────────────
router.get(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(listWorkLogsQuerySchema, 'query'),
  workLogController.list.bind(workLogController)
);

// ── Single worklog detail (all authenticated, RBAC inside service) ────────────
router.get(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  workLogController.getById.bind(workLogController)
);

// ── Update worklog ────────────────────────────────────────────────────────────
router.patch(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  validate(updateWorkLogSchema),
  workLogController.update.bind(workLogController)
);

// ── Delete worklog ────────────────────────────────────────────────────────────
router.delete(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  workLogController.remove.bind(workLogController)
);

// ── Replies ───────────────────────────────────────────────────────────────────
router.post(
  '/:id/replies',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(workLogIdParamSchema, 'params'),
  validate(createLogReplySchema),
  workLogController.addReply.bind(workLogController)
);

router.get(
  '/:id/replies',
  validate(workLogIdParamSchema, 'params'),
  workLogController.getReplies.bind(workLogController)
);

export default router;
