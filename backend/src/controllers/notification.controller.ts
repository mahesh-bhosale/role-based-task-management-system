import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await notificationService.list(
        pagination,
        {
          status: req.query.status as string | undefined,
          type: req.query.type as string | undefined,
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

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);
      return success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
