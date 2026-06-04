import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "src"

def write(rel, content):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("Wrote", rel)



write('validators/project.validator.ts', '''
import { z } from 'zod';
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
''')
