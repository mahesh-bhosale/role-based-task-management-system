import { Request, Response, NextFunction } from 'express';
import { workLogService } from '../services/worklog.service';
import { createAuditLog } from '../middlewares/auditLogger';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class WorkLogController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await workLogService.list(
        pagination,
        {
          taskId: req.query.taskId as string | undefined,
          userId: req.query.userId as string | undefined,
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
      const workLog = await workLogService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, workLog);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workLog = await workLogService.create(req.body, req.user!.id, req.user!.role);
      await createAuditLog(
        req.user!.id,
        'CREATE',
        'WorkLog',
        workLog.id,
        null,
        workLog,
        req.ip
      );
      return success(res, workLog, 'Work log created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await workLogService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      const workLog = await workLogService.update(
        asString(req.params.id),
        req.body,
        req.user!.id,
        req.user!.role
      );
      await createAuditLog(
        req.user!.id,
        'UPDATE',
        'WorkLog',
        workLog.id,
        existing,
        workLog,
        req.ip
      );
      return success(res, workLog, 'Work log updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await workLogService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      await workLogService.delete(asString(req.params.id), req.user!.id, req.user!.role);
      await createAuditLog(
        req.user!.id,
        'DELETE',
        'WorkLog',
        asString(req.params.id),
        existing,
        null,
        req.ip
      );
      return success(res, null, 'Work log deleted');
    } catch (err) {
      next(err);
    }
  }

  async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const reply = await workLogService.addReply(
        asString(req.params.id),
        req.body.message,
        req.user!.id
      );
      return success(res, reply, 'Reply added', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const workLogController = new WorkLogController();
