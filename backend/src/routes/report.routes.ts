import { Router } from 'express';
import { Role } from '@prisma/client';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  projectIdParamSchema,
  userIdParamSchema,
} from '../validators/report.validator';

const router = Router();

router.use(authenticate);

// ── GET /api/reports/overview — Admin only ────────────────────────────────────
router.get(
  '/overview',
  authorize(Role.ADMIN),
  reportController.overviewReport.bind(reportController)
);

// ── GET /api/reports/project/:projectId — Admin or PM (own projects only) ─────
router.get(
  '/project/:projectId',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectIdParamSchema, 'params'),
  reportController.projectReport.bind(reportController)
);

// ── GET /api/reports/employee/:userId — Admin or PM (their project employees) ─
router.get(
  '/employee/:userId',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(userIdParamSchema, 'params'),
  reportController.employeeReport.bind(reportController)
);

export default router;
