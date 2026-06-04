import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class NotificationController {
  /** GET /api/notifications — current user's notifications, newest first */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);

      // Parse optional isRead filter from query string
      let isRead: boolean | undefined;
      if (req.query.isRead === 'true') isRead = true;
      if (req.query.isRead === 'false') isRead = false;

      const result = await notificationService.list(
        pagination,
        {
          status: req.query.status as string | undefined,
          type: req.query.type as string | undefined,
          isRead,
        },
        req.user!.id,
        req.user!.role
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, notification);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.create(req.body);
      return success(res, notification, 'Notification created', 201);
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/notifications/:id/read */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markAsRead(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/notifications/read-all */
  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/notifications/unread-count */
  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.countUnread(req.user!.id);
      return success(res, { unreadCount: count });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
