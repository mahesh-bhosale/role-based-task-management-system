import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get role-aware dashboard statistics
 *     description: |
 *       Returns different data shapes based on the authenticated user's role:
 *       - **ADMIN**: Total projects, tasks, active employees, overdue tasks, recent audit logs, projects overview
 *       - **PROJECT_MANAGER**: Managed project count, active tasks, upcoming deadlines, employee productivity
 *       - **EMPLOYEE**: Tasks by status, due soon tasks, recent work logs, total hours this week
 *     responses:
 *       200:
 *         description: Dashboard statistics for the current role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/', dashboardController.getStats.bind(dashboardController));

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Alias for GET /dashboard
 *     description: Backward-compatible alias
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', dashboardController.getStats.bind(dashboardController));

export default router;

