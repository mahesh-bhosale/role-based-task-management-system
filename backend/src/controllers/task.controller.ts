import { Request, Response, NextFunction } from 'express';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { taskService } from '../services/task.service';
import { createAuditLog } from '../middlewares/auditLogger';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class TaskController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await taskService.list(
        pagination,
        {
          projectId: req.query.projectId as string | undefined,
          status: req.query.status as TaskStatus | undefined,
          priority: req.query.priority as TaskPriority | undefined,
          search: req.query.search as string | undefined,
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
      const task = await taskService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, task);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.create(req.body, req.user!.id);
      await createAuditLog(
        req.user!.id,
        'CREATE',
        'Task',
        task!.id,
        null,
        task,
        req.ip
      );
      return success(res, task, 'Task created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      const task = await taskService.update(asString(req.params.id), req.body);
      await createAuditLog(
        req.user!.id,
        'UPDATE',
        'Task',
        task.id,
        existing,
        task,
        req.ip
      );
      return success(res, task, 'Task updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await taskService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      await taskService.softDelete(asString(req.params.id));
      await createAuditLog(
        req.user!.id,
        'DELETE',
        'Task',
        asString(req.params.id),
        existing,
        null,
        req.ip
      );
      return success(res, null, 'Task deleted');
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.assignUsers(
        asString(req.params.id),
        req.body.userIds,
        req.user!.id
      );
      await createAuditLog(
        req.user!.id,
        'ASSIGN',
        'Task',
        asString(req.params.id),
        null,
        { userIds: req.body.userIds },
        req.ip
      );
      return success(res, task, 'Users assigned to task');
    } catch (err) {
      next(err);
    }
  }
}

export const taskController = new TaskController();
