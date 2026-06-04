import { Router } from 'express';
import { Role } from '@prisma/client';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

// POST /api/admin/test-email
router.post('/test-email', adminController.testEmail.bind(adminController));

export default router;
