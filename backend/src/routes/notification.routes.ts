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

// GET /api/notifications — current user's notifications
router.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  notificationController.list.bind(notificationController)
);

// GET /api/notifications/unread-count — badge count for current user
router.get(
  '/unread-count',
  notificationController.unreadCount.bind(notificationController)
);

// PATCH /api/notifications/read-all — must come BEFORE /:id routes
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

// GET /api/notifications/:id
router.get(
  '/:id',
  validate(notificationIdParamSchema, 'params'),
  notificationController.getById.bind(notificationController)
);

// POST /api/notifications — Admin or PM only
router.post(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createNotificationSchema),
  notificationController.create.bind(notificationController)
);

// PATCH /api/notifications/:id/read
router.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead.bind(notificationController)
);

export default router;
