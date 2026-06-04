import { Router } from 'express';
import { Role } from '@prisma/client';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  notificationIdParamSchema,
  listNotificationsQuerySchema,
  createNotificationSchema,
} from '../validators/notification.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  notificationController.list.bind(notificationController)
);
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));
router.get(
  '/:id',
  validate(notificationIdParamSchema, 'params'),
  notificationController.getById.bind(notificationController)
);
router.post(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createNotificationSchema),
  notificationController.create.bind(notificationController)
);
router.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead.bind(notificationController)
);

export default router;
