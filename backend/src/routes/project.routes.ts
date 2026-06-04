import { Router } from 'express';
import { Role } from '@prisma/client';
import { projectController } from '../controllers/project.controller';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectIdTasksParamSchema,
  listProjectsQuerySchema,
  listProjectTasksQuerySchema,
} from '../validators/project.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  projectController.list.bind(projectController)
);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createProjectSchema),
  projectController.create.bind(projectController)
);

router.get(
  '/:projectId/tasks',
  validate(projectIdTasksParamSchema, 'params'),
  validate(listProjectTasksQuerySchema, 'query'),
  taskController.listByProject.bind(taskController)
);

router.get(
  '/:id',
  validate(projectIdParamSchema, 'params'),
  projectController.getById.bind(projectController)
);

router.put(
  '/:id',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  projectController.update.bind(projectController)
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate(projectIdParamSchema, 'params'),
  projectController.remove.bind(projectController)
);

router.patch(
  '/:id/archive',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectIdParamSchema, 'params'),
  projectController.archive.bind(projectController)
);

export default router;