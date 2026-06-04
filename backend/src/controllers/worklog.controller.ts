import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { workLogService } from '../services/worklog.service';
import { createAuditLog } from '../middlewares/auditLogger';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class WorkLogController {
  // ── POST /api/tasks/:taskId/worklogs ───────────────────────────────────────
  async createForTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = asString(req.params.taskId);

      // Build attachment URL if a file was uploaded
      let attachmentUrl: string | null = null;
      if (req.file) {
        attachmentUrl = `/uploads/${req.file.filename}`;
      }

      const workLog = await workLogService.createForTask(
        taskId,
        {
          description: req.body.description,
          hoursWorked: Number(req.body.hoursWorked),
        },
        attachmentUrl,
        req.user!.id,
        req.user!.role
      );

      await createAuditLog(
        req.user!.id,
        'WORKLOG_SUBMIT',
        'WORKLOG',
        workLog.id,
        null,
        workLog as unknown as Prisma.InputJsonValue,
        req.ip
      );

      return success(res, workLog, 'Work log submitted', 201);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/tasks/:taskId/worklogs ────────────────────────────────────────
  async listForTask(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await workLogService.listForTask(
        asString(req.params.taskId),
        pagination,
        req.user!.id,
        req.user!.role
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/worklogs ──────────────────────────────────────────────────────
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await workLogService.list(
        pagination,
        {
          userId: req.query.userId as string | undefined,
          projectId: req.query.projectId as string | undefined,
          taskId: req.query.taskId as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        },
        req.user!.id,
        req.user!.role
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/worklogs/:id ─────────────────────────────────────────────────
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

  // ── POST /api/worklogs/:id/replies ────────────────────────────────────────
  async addReply(req: Request, res: Response, next: NextFunction) {
    try {
      const reply = await workLogService.addReply(
        asString(req.params.id),
        req.body.message,
        req.user!.id,
        req.user!.role
      );

      await createAuditLog(
        req.user!.id,
        'LOG_REPLY',
        'LOGREPLY',
        reply.id,
        null,
        reply as unknown as Prisma.InputJsonValue,
        req.ip
      );

      return success(res, reply, 'Reply added', 201);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/worklogs/:id/replies ─────────────────────────────────────────
  async getReplies(req: Request, res: Response, next: NextFunction) {
    try {
      const replies = await workLogService.getReplies(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, replies);
    } catch (err) {
      next(err);
    }
  }

  // ── PATCH /api/worklogs/:id ───────────────────────────────────────────────
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
        'WORKLOG',
        workLog!.id,
        existing as unknown as Prisma.InputJsonValue,
        workLog as unknown as Prisma.InputJsonValue,
        req.ip
      );
      return success(res, workLog, 'Work log updated');
    } catch (err) {
      next(err);
    }
  }

  // ── DELETE /api/worklogs/:id ──────────────────────────────────────────────
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
        'WORKLOG',
        asString(req.params.id),
        existing as unknown as Prisma.InputJsonValue,
        null,
        req.ip
      );
      return success(res, null, 'Work log deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const workLogController = new WorkLogController();
