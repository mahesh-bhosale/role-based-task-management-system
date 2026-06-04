import { Router } from 'express';
import { workLogController } from '../controllers/worklog.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import {
  createWorkLogSchema,
  updateWorkLogSchema,
  createLogReplySchema,
  workLogIdParamSchema,
  listWorkLogsQuerySchema,
} from '../validators/worklog.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listWorkLogsQuerySchema, 'query'),
  workLogController.list.bind(workLogController)
);
router.get(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  workLogController.getById.bind(workLogController)
);
router.post('/', validate(createWorkLogSchema), workLogController.create.bind(workLogController));
router.patch(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  validate(updateWorkLogSchema),
  workLogController.update.bind(workLogController)
);
router.delete(
  '/:id',
  validate(workLogIdParamSchema, 'params'),
  workLogController.remove.bind(workLogController)
);
router.post(
  '/:id/replies',
  validate(workLogIdParamSchema, 'params'),
  validate(createLogReplySchema),
  workLogController.addReply.bind(workLogController)
);

export default router;
