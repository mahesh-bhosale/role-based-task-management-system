import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';

// ── helpers ───────────────────────────────────────────────────────────────────

/** ISO week boundaries (Monday 00:00 → Sunday 23:59:59) for the current date */
function currentIsoWeekRange(): { gte: Date; lte: Date } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { gte: monday, lte: sunday };
}

/** Completion percentage: completedTasks / totalTasks * 100 */
function completionPct(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100 * 10) / 10;
}

// ── ADMIN dashboard ───────────────────────────────────────────────────────────

async function adminDashboard() {
  const now = new Date();

  const [
    totalProjects,
    totalTasks,
    activeEmployees,
    overdueTasks,
    completedTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.task.count({ where: { deletedAt: null } }),

    // Active employees: role=EMPLOYEE, isActive=true, at least one task assignment
    prisma.user.count({
      where: {
        role: Role.EMPLOYEE,
        isActive: true,
        taskAssignments: { some: {} },
      },
    }),

    // Overdue: deadline passed, not completed
    prisma.task.count({
      where: {
        deletedAt: null,
        deadline: { lt: now },
        status: { not: TaskStatus.COMPLETED },
      },
    }),

    prisma.task.count({
      where: { deletedAt: null, status: TaskStatus.COMPLETED },
    }),
  ]);

  // Projects overview with manager name and task count
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      manager: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
      tasks: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  const projectsOverview = projects.map((p) => {
    const taskCount = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      completionPercentage: completionPct(done, taskCount),
      managerName: p.manager?.name ?? null,
      taskCount,
    };
  });

  // Recent audit logs
  const recentAuditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    totalProjects,
    totalTasks,
    activeEmployees,
    overdueTasks,
    completedTasks,
    projectsOverview,
    recentAuditLogs,
  };
}

// ── PM dashboard ──────────────────────────────────────────────────────────────

async function pmDashboard(userId: string) {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 3600_000);

  const [managedProjectsCount, activeTasksCount] = await Promise.all([
    prisma.project.count({ where: { managerId: userId, deletedAt: null } }),
    prisma.task.count({
      where: {
        deletedAt: null,
        status: { notIn: [TaskStatus.COMPLETED] },
        project: { managerId: userId, deletedAt: null },
      },
    }),
  ]);

  // Upcoming deadlines — tasks in the next 7 days under PM's projects
  const upcomingRaw = await prisma.task.findMany({
    where: {
      deletedAt: null,
      deadline: { gte: now, lte: in7Days },
      status: { not: TaskStatus.COMPLETED },
      project: { managerId: userId, deletedAt: null },
    },
    orderBy: { deadline: 'asc' },
    select: {
      id: true,
      name: true,
      deadline: true,
      priority: true,
      project: { select: { name: true } },
      assignments: {
        take: 1,
        include: { user: { select: { name: true } } },
      },
    },
  });

  const upcomingDeadlines = upcomingRaw.map((t) => ({
    taskName: t.name,
    deadline: t.deadline,
    priority: t.priority,
    projectName: t.project.name,
    assigneeName: t.assignments[0]?.user.name ?? null,
  }));

  // Employee productivity: assigned vs completed within PM's projects
  const employees = await prisma.user.findMany({
    where: {
      role: Role.EMPLOYEE,
      isActive: true,
      taskAssignments: {
        some: { task: { project: { managerId: userId }, deletedAt: null } },
      },
    },
    select: {
      id: true,
      name: true,
      taskAssignments: {
        where: { task: { project: { managerId: userId }, deletedAt: null } },
        include: { task: { select: { status: true } } },
      },
    },
  });

  const employeeProductivity = employees.map((emp) => {
    const assigned = emp.taskAssignments.length;
    const completed = emp.taskAssignments.filter(
      (a) => a.task.status === TaskStatus.COMPLETED
    ).length;
    return {
      employeeName: emp.name,
      assignedTasks: assigned,
      completedTasks: completed,
      completionRate: completionPct(completed, assigned),
    };
  });

  // Projects summary
  const pmProjects = await prisma.project.findMany({
    where: { managerId: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      status: true,
      tasks: {
        where: { deletedAt: null },
        select: { status: true },
      },
    },
  });

  const projectsSummary = pmProjects.map((p) => {
    const total = p.tasks.length;
    const completed = p.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pending = p.tasks.filter((t) =>
      (['TODO', 'IN_PROGRESS', 'IN_REVIEW'] as string[]).includes(t.status)
    ).length;
    const blocked = p.tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      completionPercentage: completionPct(completed, total),
      taskCounts: { total, completed, pending, blocked },
    };
  });

  return {
    managedProjectsCount,
    activeTasksCount,
    upcomingDeadlines,
    employeeProductivity,
    projectsSummary,
  };
}

// ── Employee dashboard ────────────────────────────────────────────────────────

async function employeeDashboard(userId: string) {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600_000);
  const weekRange = currentIsoWeekRange();

  // Tasks by status
  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    where: {
      deletedAt: null,
      assignments: { some: { userId } },
    },
    _count: { _all: true },
  });

  const tasksByStatus = {
    todo: 0,
    inProgress: 0,
    inReview: 0,
    completed: 0,
    blocked: 0,
  };
  for (const g of statusGroups) {
    if (g.status === TaskStatus.TODO) tasksByStatus.todo = g._count._all;
    if (g.status === TaskStatus.IN_PROGRESS) tasksByStatus.inProgress = g._count._all;
    if (g.status === TaskStatus.IN_REVIEW) tasksByStatus.inReview = g._count._all;
    if (g.status === TaskStatus.COMPLETED) tasksByStatus.completed = g._count._all;
    if (g.status === TaskStatus.BLOCKED) tasksByStatus.blocked = g._count._all;
  }

  // Due soon tasks (next 48 h)
  const dueSoonRaw = await prisma.task.findMany({
    where: {
      deletedAt: null,
      deadline: { gte: now, lte: in48h },
      status: { not: TaskStatus.COMPLETED },
      assignments: { some: { userId } },
    },
    orderBy: { deadline: 'asc' },
    select: {
      id: true,
      name: true,
      deadline: true,
      priority: true,
      project: { select: { name: true } },
    },
  });

  const dueSoonTasks = dueSoonRaw.map((t) => ({
    id: t.id,
    name: t.name,
    deadline: t.deadline,
    priority: t.priority,
    projectName: t.project.name,
  }));

  // Recently completed tasks (last 5)
  const recentlyCompletedTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: TaskStatus.COMPLETED,
      assignments: { some: { userId } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      project: { select: { name: true } },
    },
  });

  // Recent work logs (last 5)
  const recentWorkLogs = await prisma.workLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      description: true,
      hoursWorked: true,
      createdAt: true,
      task: { select: { id: true, name: true } },
    },
  });

  // Total hours this ISO week
  const weekHoursAgg = await prisma.workLog.aggregate({
    where: { userId, createdAt: weekRange },
    _sum: { hoursWorked: true },
  });

  return {
    tasksByStatus,
    dueSoonTasks,
    recentlyCompletedTasks,
    recentWorklogs: recentWorkLogs.map((wl) => ({
      id: wl.id,
      taskName: wl.task?.name ?? 'Unknown Task',
      hoursWorked: wl.hoursWorked,
      description: wl.description,
      createdAt: wl.createdAt,
    })),
    totalHoursThisWeek: weekHoursAgg._sum.hoursWorked ?? 0,
  };
}

// ── Service class ─────────────────────────────────────────────────────────────

export class DashboardService {
  async getStats(userId: string, role: Role) {
    if (role === Role.ADMIN) return adminDashboard();
    if (role === Role.PROJECT_MANAGER) return pmDashboard(userId);
    return employeeDashboard(userId);
  }
}

export const dashboardService = new DashboardService();
