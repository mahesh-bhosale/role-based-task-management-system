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
      const result = await projectService.getProjects(
        {
          status: req.query.status as ProjectStatus | undefined,
          managerId: req.query.managerId as string | undefined,
          managerName: req.query.managerName as string | undefined,
          startDate: req.query.startDate ? new Date(String(req.query.startDate)) : undefined,
          endDate: req.query.endDate ? new Date(String(req.query.endDate)) : undefined,
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
      const project = await projectService.getProjectById(asString(req.params.id), {
        id: req.user!.id,
        role: req.user!.role,
      });
      return success(res, project);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.createProject(req.body, {
        id: req.user!.id,
        role: req.user!.role,
      });
      await createAuditLog(
        req.user!.id,
        'CREATE',
        'PROJECT',
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
      const project = await projectService.updateProject(
        asString(req.params.id),
        req.body,
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, project, 'Project updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await projectService.deleteProject(
        asString(req.params.id),
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, null, 'Project deleted');
    } catch (err) {
      next(err);
    }
  }

  async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await projectService.archiveProject(
        asString(req.params.id),
        { id: req.user!.id, role: req.user!.role },
        req.ip
      );
      return success(res, project, 'Project archived');
    } catch (err) {
      next(err);
    }
  }
}

export const projectController = new ProjectController();