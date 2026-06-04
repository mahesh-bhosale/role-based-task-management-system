import { Router } from 'express';
import { Role } from '@prisma/client';
import { projectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  listProjectsQuerySchema,
} from '../validators/project.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  projectController.list.bind(projectController)
);
router.get(
  '/:id',
  validate(projectIdParamSchema, 'params'),
  projectController.getById.bind(projectController)
);
router.post(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createProjectSchema),
  projectController.create.bind(projectController)
);
router.patch(
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

export default router;
