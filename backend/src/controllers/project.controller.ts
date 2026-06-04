import { Request, Response, NextFunction } from 'express';
import { ProjectStatus } from '@prisma/client';
import { projectService } from '../services/project.service';
import { createAuditLog } from '../middlewares/auditLogger';
import { success } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { asString } from '../utils/params';

export class ProjectController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req.query as Record<string, unknown>);
      const result = await projectService.list(
        pagination,
        {
          status: req.query.status as ProjectStatus | undefined,
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
      const project = await projectService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return success(res, project);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.create(req.body, req.user!.id);
      await createAuditLog(
        req.user!.id,
        'CREATE',
        'Project',
        project.id,
        null,
        project,
        req.ip
      );
      return success(res, project, 'Project created', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await projectService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      const project = await projectService.update(asString(req.params.id), req.body);
      await createAuditLog(
        req.user!.id,
        'UPDATE',
        'Project',
        project.id,
        existing,
        project,
        req.ip
      );
      return success(res, project, 'Project updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await projectService.getById(
        asString(req.params.id),
        req.user!.id,
        req.user!.role
      );
      await projectService.softDelete(asString(req.params.id));
      await createAuditLog(
        req.user!.id,
        'DELETE',
        'Project',
        asString(req.params.id),
        existing,
        null,
        req.ip
      );
      return success(res, null, 'Project deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const projectController = new ProjectController();
