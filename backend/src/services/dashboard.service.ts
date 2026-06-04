import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class DashboardService {
  async getStats(userId: string, role: Role) {
    if (role === Role.ADMIN) {
      const [users, projects, tasks, workLogs, notifications] = await Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.task.count({ where: { deletedAt: null } }),
        prisma.workLog.count(),
        prisma.notification.count({ where: { status: 'sent' } }),
      ]);

      const tasksByStatus = await prisma.task.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      });

      return {
        users,
        projects,
        tasks,
        workLogs,
        unreadNotifications: notifications,
        tasksByStatus: Object.fromEntries(
          tasksByStatus.map((t) => [t.status, t._count])
        ),
      };
    }

    if (role === Role.PROJECT_MANAGER) {
      const [managedProjects, teamTasks, overdueTasks] = await Promise.all([
        prisma.project.count({ where: { managerId: userId, deletedAt: null } }),
        prisma.task.count({
          where: {
            deletedAt: null,
            project: { managerId: userId, deletedAt: null },
          },
        }),
        prisma.task.count({
          where: {
            deletedAt: null,
            deadline: { lt: new Date() },
            status: { not: TaskStatus.COMPLETED },
            project: { managerId: userId, deletedAt: null },
          },
        }),
      ]);

      return { managedProjects, teamTasks, overdueTasks };
    }

    const [assignedTasks, myWorkLogs, pendingTasks, unreadNotifications] =
      await Promise.all([
        prisma.taskAssignment.count({ where: { userId } }),
        prisma.workLog.count({ where: { userId } }),
        prisma.task.count({
          where: {
            deletedAt: null,
            status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
            assignments: { some: { userId } },
          },
        }),
        prisma.notification.count({ where: { userId, status: 'sent' } }),
      ]);

    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        deletedAt: null,
        deadline: { gte: new Date() },
        status: { not: TaskStatus.COMPLETED },
        assignments: { some: { userId } },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
      select: { id: true, name: true, deadline: true, status: true, priority: true },
    });

    return {
      assignedTasks,
      myWorkLogs,
      pendingTasks,
      unreadNotifications,
      upcomingDeadlines,
    };
  }
}

export const dashboardService = new DashboardService();
