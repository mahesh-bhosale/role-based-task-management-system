import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import workLogRoutes from './worklog.routes';
import taskWorkLogRoutes from './task-worklogs.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import reportRoutes from './report.routes';
import dashboardRoutes from './dashboard.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
// Nested: /api/tasks/:taskId/worklogs
router.use('/tasks/:taskId/worklogs', taskWorkLogRoutes);
// Flat: /api/worklogs
router.use('/worklogs', workLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
