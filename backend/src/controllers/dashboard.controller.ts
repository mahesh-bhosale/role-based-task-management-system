import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { success } from '../utils/response';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats(req.user!.id, req.user!.role);
      return success(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
