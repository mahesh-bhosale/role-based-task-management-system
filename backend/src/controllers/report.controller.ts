import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { success } from '../utils/response';

export class ReportController {
  async projectReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.projectReport(
        {
          projectId: req.query.projectId as string | undefined,
          from: req.query.from ? new Date(req.query.from as string) : undefined,
          to: req.query.to ? new Date(req.query.to as string) : undefined,
        },
        req.user!.role
      );
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async userReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.userReport(
        {
          userId: req.query.userId as string | undefined,
          from: req.query.from ? new Date(req.query.from as string) : undefined,
          to: req.query.to ? new Date(req.query.to as string) : undefined,
        },
        req.user!.role
      );
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async taskReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.taskReport({
        projectId: req.query.projectId as string | undefined,
        status: req.query.status as string | undefined,
      });
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
