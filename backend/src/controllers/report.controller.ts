import { Request, Response, NextFunction } from 'express';
import {
  getProjectReport,
  getEmployeeReport,
  getOverviewReport,
} from '../services/report.service';
import { success } from '../utils/response';
import { asString } from '../utils/params';

export class ReportController {
  /** GET /api/reports/project/:projectId — Admin or PM (own projects only) */
  async projectReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await getProjectReport(
        asString(req.params.projectId),
        req.user!.id,
        req.user!.role
      );
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/reports/employee/:userId — Admin or PM (employees in their projects) */
  async employeeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await getEmployeeReport(
        asString(req.params.userId),
        req.user!.id,
        req.user!.role
      );
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/reports/overview — Admin only */
  async overviewReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await getOverviewReport(req.user!.id, req.user!.role);
      return success(res, report);
    } catch (err) {
      next(err);
    }
  }
}

export const reportController = new ReportController();
