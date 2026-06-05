import { Router } from 'express';
import { Role } from '@prisma/client';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  assignTaskSchema,
  listTasksQuerySchema,
} from '../validators/task.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks (role-filtered — employees see only assigned tasks)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: assigneeName
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: deadlineBefore
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated task list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/',
  validate(listTasksQuerySchema, 'query'),
  taskController.list.bind(taskController)
);

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task (Admin or PM)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectId, priority]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               projectId: { type: string, format: uuid }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *               deadline: { type: string, format: date-time }
 *               estimatedHours: { type: number }
 *               assignedToUserId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Task created
 */
router.post(
  '/',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createTaskSchema),
  taskController.create.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}/history:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task audit history
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task audit log history
 */
router.get(
  '/:id/history',
  validate(taskIdParamSchema, 'params'),
  taskController.history.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task detail
 *       404:
 *         description: Task not found
 */
router.get(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  taskController.getById.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update task fields (name, description, priority, status, deadline)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  taskController.update.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Soft-delete a task (Admin or PM)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete(
  '/:id',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  taskController.remove.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}/assign:
 *   patch:
 *     tags: [Tasks]
 *     summary: Assign an employee to a task (Admin or PM)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task assigned
 */
router.patch(
  '/:id/assign',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  validate(assignTaskSchema),
  taskController.assign.bind(taskController)
);

/**
 * @swagger
 * /tasks/{id}/assign:
 *   delete:
 *     tags: [Tasks]
 *     summary: Unassign employee from a task (Admin or PM)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task unassigned
 */
router.delete(
  '/:id/assign',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(taskIdParamSchema, 'params'),
  taskController.unassign.bind(taskController)
);

export default router;