import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/audit.service';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await auditService.list(
        pagination,
        {
          userId: req.query.userId as string | undefined,
          entity: req.query.entity as string | undefined,
          action: req.query.action as string | undefined,
          entityId: req.query.entityId as string | undefined,
          from: req.query.from ? new Date(req.query.from as string) : undefined,
          to: req.query.to ? new Date(req.query.to as string) : undefined,
        },
        req.user!.role
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
