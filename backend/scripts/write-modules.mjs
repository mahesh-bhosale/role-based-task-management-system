import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'src');

const files = {
  'validators/project.validator.ts': `import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(ProjectStatus).optional(),
  managerId: z.string().uuid().optional().nullable(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    managerId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const projectIdTasksParamSchema = z.object({
  projectId: z.string().uuid(),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  managerId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const listProjectTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
});
`,

  'validators/task.validator.ts': `import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  priority: z.nativeEnum(TaskPriority),
  deadline: z.coerce.date().optional(),
  estimatedHours: z.number().positive().optional(),
  assignedToUserId: z.string().uuid().optional(),
});

export const updateTaskSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    deadline: z.coerce.date().optional().nullable(),
    estimatedHours: z.number().positive().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const taskIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedUserId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  deadlineBefore: z.coerce.date().optional(),
  deadlineAfter: z.coerce.date().optional(),
  search: z.string().optional(),
});
`,
};

for (const [rel, content] of Object.entries(files)) {
  const full = path.join(src, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('Wrote', rel);
}
