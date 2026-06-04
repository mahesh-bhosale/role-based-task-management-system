import { Router } from 'express';
import { Role } from '@prisma/client';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from '../validators/user.validator';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

// GET /api/users — list all users with optional role filter
router.get('/', validate(listUsersQuerySchema, 'query'), userController.list.bind(userController));

// POST /api/users — create user
router.post('/', validate(createUserSchema), userController.create.bind(userController));

// GET /api/users/:id — user detail with assigned tasks and recent logs
router.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.getById.bind(userController)
);

// PUT /api/users/:id — update name, email, role, isActive
router.put(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);

// PATCH /api/users/:id — partial update (same handler)
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);

// DELETE /api/users/:id — deactivate (soft delete)
router.delete(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.deactivate.bind(userController)
);

export default router;
