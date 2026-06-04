import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types/shared';

export class ReportService {
  async projectReport(
    filters: { projectId?: string; from?: Date; to?: Date },
    role: Role
  ) {
    if (role === Role.EMPLOYEE) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(filters.projectId && { id: filters.projectId }),
      },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: {
            workLogs: {
              where: {
                ...(filters.from || filters.to
                  ? {
                      createdAt: {
                        ...(filters.from && { gte: filters.from }),
                        ...(filters.to && { lte: filters.to }),
                      },
                    }
                  : {}),
              },
            },
            assignments: true,
          },
        },
      },
    });

    return projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      const totalHours = project.tasks.reduce(
        (sum, task) => sum + task.workLogs.reduce((h, log) => h + log.hoursWorked, 0),
        0
      );

      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        totalTasks,
        completedTasks,
        completionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
        totalHoursLogged: totalHours,
      };
    });
  }

  async userReport(filters: { userId?: string; from?: Date; to?: Date }, role: Role) {
    if (role === Role.EMPLOYEE) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(filters.userId && { id: filters.userId }),
      },
      include: {
        workLogs: {
          where: {
            ...(filters.from || filters.to
              ? {
                  createdAt: {
                    ...(filters.from && { gte: filters.from }),
                    ...(filters.to && { lte: filters.to }),
                  },
                }
              : {}),
          },
        },
        taskAssignments: {
          where: { task: { deletedAt: null } },
          include: { task: { select: { id: true, name: true, status: true } } },
        },
      },
    });

    return users.map((user) => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedTasks: user.taskAssignments.length,
      totalHoursLogged: user.workLogs.reduce((sum, log) => sum + log.hoursWorked, 0),
      workLogCount: user.workLogs.length,
    }));
  }

  async taskReport(filters: { projectId?: string; status?: string }) {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.status && { status: filters.status as TaskStatus }),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
        workLogs: true,
      },
    });

    return tasks.map((task) => ({
      taskId: task.id,
      taskName: task.name,
      projectName: task.project.name,
      status: task.status,
      priority: task.priority,
      assignees: task.assignments.map((a) => a.user.name),
      estimatedHours: task.estimatedHours,
      loggedHours: task.workLogs.reduce((sum, log) => sum + log.hoursWorked, 0),
      deadline: task.deadline,
    }));
  }
}

export const reportService = new ReportService();
