import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.use(authenticate);

// GET /api/dashboard — auto-dispatches by role
router.get('/', dashboardController.getStats.bind(dashboardController));

// Keep backward-compat alias for /stats
router.get('/stats', dashboardController.getStats.bind(dashboardController));

export default router;
