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

router.use(authenticate);

// GET /api/users — list all users with optional role filter
router.get('/', validate(listUsersQuerySchema, 'query'), authorize(Role.ADMIN, Role.PROJECT_MANAGER), userController.list.bind(userController));

// POST /api/users — create user
router.post('/', authorize(Role.ADMIN), validate(createUserSchema), userController.create.bind(userController));

// GET /api/users/:id — user detail with assigned tasks and recent logs
router.get(
  '/:id',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(userIdParamSchema, 'params'),
  userController.getById.bind(userController)
);

// PUT /api/users/:id — update name, email, role, isActive
router.put(
  '/:id',
  authorize(Role.ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);

// PATCH /api/users/:id — partial update (same handler)
router.patch(
  '/:id',
  authorize(Role.ADMIN),
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);

// DELETE /api/users/:id — deactivate (soft delete)
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate(userIdParamSchema, 'params'),
  userController.deactivate.bind(userController)
);

export default router;
