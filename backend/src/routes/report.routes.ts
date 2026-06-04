import { Router } from 'express';
import { Role } from '@prisma/client';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  projectReportQuerySchema,
  userReportQuerySchema,
  taskReportQuerySchema,
} from '../validators/report.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/projects',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectReportQuerySchema, 'query'),
  reportController.projectReport.bind(reportController)
);
router.get(
  '/users',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(userReportQuerySchema, 'query'),
  reportController.userReport.bind(reportController)
);
router.get(
  '/tasks',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskReportQuerySchema, 'query'),
  reportController.taskReport.bind(reportController)
);

export default router;
