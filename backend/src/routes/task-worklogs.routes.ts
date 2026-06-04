import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { workLogController } from '../controllers/worklog.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { handleMulterError } from '../middlewares/multerError';
import { uploadAttachment } from '../utils/upload';
import {
  taskIdParamSchema,
  listTaskWorkLogsQuerySchema,
} from '../validators/worklog.validator';
import { AppError } from '../types/shared';

// This router is mounted with mergeParams:true so :taskId is accessible
const router = Router({ mergeParams: true });

router.use(authenticate);

// ── POST /api/tasks/:taskId/worklogs  (Employee only, must be assigned) ───────
router.post(
  '/',
  authorize(Role.EMPLOYEE),
  validate(taskIdParamSchema, 'params'),
  // Run multer, then catch any multer errors before hitting the controller
  (req: Request, res: Response, next: NextFunction) => {
    uploadAttachment(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      // Validate body fields that arrive as form-data strings
      if (!req.body.description || String(req.body.description).trim() === '') {
        return next(new AppError(400, 'description is required'));
      }
      const hours = Number(req.body.hoursWorked);
      if (isNaN(hours) || hours <= 0) {
        return next(new AppError(400, 'hoursWorked must be a positive number'));
      }
      next();
    });
  },
  workLogController.createForTask.bind(workLogController)
);

// ── GET /api/tasks/:taskId/worklogs  (Admin/PM of project or assigned Employee) ─
router.get(
  '/',
  validate(taskIdParamSchema, 'params'),
  validate(listTaskWorkLogsQuerySchema, 'query'),
  workLogController.listForTask.bind(workLogController)
);

export default router;
