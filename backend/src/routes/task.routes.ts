import { Router } from 'express';
import { Role } from '@prisma/client';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  assignTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listTasksQuerySchema, 'query'),
  taskController.list.bind(taskController)
);

router.post(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createTaskSchema),
  taskController.create.bind(taskController)
);

router.get(
  '/:id/history',
  validate(taskIdParamSchema, 'params'),
  taskController.history.bind(taskController)
);

router.get(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  taskController.getById.bind(taskController)
);

router.put(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  taskController.update.bind(taskController)
);

router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  taskController.remove.bind(taskController)
);

router.patch(
  '/:id/assign',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  validate(assignTaskSchema),
  taskController.assign.bind(taskController)
);

router.delete(
  '/:id/assign',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  taskController.unassign.bind(taskController)
);

export default router;