import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { createAuditLog } from '../middlewares/auditLogger';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await userService.list(pagination);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getById(asString(req.params.id));
      return success(res, user);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body);
      await createAuditLog(
        req.user!.id,
        'CREATE',
        'User',
        user.id,
        null,
        user,
        req.ip
      );
      return success(res, user, 'User created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await userService.getById(asString(req.params.id));
      const user = await userService.update(asString(req.params.id), req.body);
      await createAuditLog(
        req.user!.id,
        'UPDATE',
        'User',
        user.id,
        existing,
        user,
        req.ip
      );
      return success(res, user, 'User updated');
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await userService.getById(asString(req.params.id));
      const user = await userService.deactivate(asString(req.params.id));
      await createAuditLog(
        req.user!.id,
        'DEACTIVATE',
        'User',
        user.id,
        existing,
        user,
        req.ip
      );
      return success(res, user, 'User deactivated');
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
