import { Request, Response, NextFunction } from 'express';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { taskService } from '../services/task.service';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class TaskController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await taskService.getTasks(
        {
          projectId: req.query.projectId as string | undefined,
          status: req.query.status as TaskStatus | undefined,
          priority: req.query.priority as TaskPriority | undefined,
          assignedUserId: req.query.assignedUserId as string | undefined,
          deadlineBefore: req.query.deadlineBefore
            ? new Date(String(req.query.deadlineBefore))
            : undefined,
          deadlineAfter: req.query.deadlineAfter
            ? new Date(String(req.query.deadlineAfter))
            : undefined,
          search: req.query.search as string | undefined,
          assigneeName: req.query.assigneeName as string | undefined,
        },
        pagination,
        { id: req.user!.id, role: req.user!.role }
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await taskService.getProjectTasks(
        asString(req.params.projectId),
        {
          status: req.query.status as TaskStatus | undefined,
          priority: req.query.priority as TaskPriority | undefined,
          search: req.query.search as string | undefined,
        },
        pagination,
        { id: req.user!.id, role: req.user!.role }
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTaskById(asString(req.params.id), {
        id: req.user!.id,
        role: req.user!.role,
      });
      return success(res, task);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.createTask(
        req.body,
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, task, 'Task created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.updateTask(
        asString(req.params.id),
        req.body,
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, task, 'Task updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await taskService.deleteTask(
        asString(req.params.id),
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, null, 'Task deleted');
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.assignTask(
        asString(req.params.id),
        req.body.userId,
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, task, 'Task assigned');
    } catch (err) {
      next(err);
    }
  }

  async unassign(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.unassignTask(
        asString(req.params.id),
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, task, 'Task unassigned');
    } catch (err) {
      next(err);
    }
  }

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await taskService.getTaskHistory(asString(req.params.id), {
        id: req.user!.id,
        role: req.user!.role,
      });
      return success(res, logs);
    } catch (err) {
      next(err);
    }
  }
}

export const taskController = new TaskController();