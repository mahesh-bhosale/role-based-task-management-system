import { Router } from 'express';
import { Role } from '@prisma/client';
import { projectController } from '../controllers/project.controller';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  projectIdTasksParamSchema,
  listProjectsQuerySchema,
  listProjectTasksQuerySchema,
} from '../validators/project.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects (role-filtered)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PLANNING, ACTIVE, COMPLETED, ARCHIVED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: managerName
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated project list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  projectController.list.bind(projectController)
);

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, startDate, endDate]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               status: { type: string, enum: [PLANNING, ACTIVE, COMPLETED, ARCHIVED] }
 *               managerId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Project created
 *       403:
 *         description: Admin access required
 */
router.post(
  '/',
  authorize(Role.ADMIN),
  validate(createProjectSchema),
  projectController.create.bind(projectController)
);

/**
 * @swagger
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Projects]
 *     summary: List tasks for a specific project
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated task list for project
 */
router.get(
  '/:projectId/tasks',
  validate(projectIdTasksParamSchema, 'params'),
  validate(listProjectTasksQuerySchema, 'query'),
  taskController.listByProject.bind(taskController)
);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project detail
 *       404:
 *         description: Project not found
 */
router.get(
  '/:id',
  validate(projectIdParamSchema, 'params'),
  projectController.getById.bind(projectController)
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update project (Admin or PM)
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
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  projectController.update.bind(projectController)
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project deleted
 *       403:
 *         description: Admin access required
 */
router.delete(
  '/:id',
  authorize(Role.ADMIN),
  validate(projectIdParamSchema, 'params'),
  projectController.remove.bind(projectController)
);

/**
 * @swagger
 * /projects/{id}/archive:
 *   patch:
 *     tags: [Projects]
 *     summary: Archive a project (Admin or PM)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project archived
 */
router.patch(
  '/:id/archive',
  authorize(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(projectIdParamSchema, 'params'),
  projectController.archive.bind(projectController)
);

export default router;