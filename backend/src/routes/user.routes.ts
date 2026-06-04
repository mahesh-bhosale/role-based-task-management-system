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
} from '../validators/user.validator';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/', userController.list.bind(userController));
router.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.getById.bind(userController)
);
router.post('/', validate(createUserSchema), userController.create.bind(userController));
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update.bind(userController)
);
router.delete(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.deactivate.bind(userController)
);

export default router;
