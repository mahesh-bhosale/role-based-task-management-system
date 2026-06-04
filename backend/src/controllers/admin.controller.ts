import { Request, Response, NextFunction } from 'express';
import { sendTestEmail } from '../services/email.service';
import { success } from '../utils/response';
import { AppError } from '../types/shared';

export class AdminController {
  /** POST /api/admin/test-email — Admin only.
   *  Body: { to: string, type: "reminder" | "overdue" }
   */
  async testEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { to, type } = req.body as { to?: string; type?: string };

      if (!to || typeof to !== 'string' || !to.includes('@')) {
        throw new AppError(400, 'Valid email address required in "to" field');
      }
      if (!type || !['reminder', 'overdue'].includes(type)) {
        throw new AppError(400, '"type" must be "reminder" or "overdue"');
      }

      await sendTestEmail({ to, type: type as 'reminder' | 'overdue' });

      return success(res, { to, type }, `Test ${type} email sent to ${to}`);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
