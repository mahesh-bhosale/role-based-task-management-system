import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../types/shared';

// ── helpers ───────────────────────────────────────────────────────────────────

function completionPct(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100 * 10) / 10;
}

// ── GET /api/reports/project/:projectId ───────────────────────────────────────

export async function getProjectReport(
  projectId: string,
  requesterId: string,
  role: Role
) {
  if (role === Role.EMPLOYEE) {
    throw new AppError(403, 'Employees cannot access project reports');
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      // PM can only see their own projects
      ...(role === Role.PROJECT_MANAGER && { managerId: requesterId }),
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      tasks: {
        where: { deletedAt: null },
        include: {
          assignments: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          workLogs: { select: { hoursWorked: true } },
        },
      },
    },
  });

  if (!project) {
    throw new AppError(404, 'Project not found or access denied');
  }

  const tasks = project.tasks;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const pendingTasks = tasks.filter((t) =>
    (['TODO', 'IN_REVIEW'] as string[]).includes(t.status)
  ).length;
  const blockedTasks = tasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;

  // Build per-employee stats
  const employeeMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      assignedTasks: number;
      completedTasks: number;
      hoursLogged: number;
    }
  >();

  for (const task of tasks) {
    const taskHours = task.workLogs.reduce((s, l) => s + l.hoursWorked, 0);

    for (const assignment of task.assignments) {
      const u = assignment.user;
      if (!employeeMap.has(u.id)) {
        employeeMap.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          assignedTasks: 0,
          completedTasks: 0,
          hoursLogged: 0,
        });
      }
      const entry = employeeMap.get(u.id)!;
      entry.assignedTasks += 1;
      if (task.status === TaskStatus.COMPLETED) entry.completedTasks += 1;
      // Spread hours across assignees (or attribute to first assignee only — we attribute all)
      entry.hoursLogged += taskHours;
    }
  }

  const employees = Array.from(employeeMap.values()).map((e) => ({
    ...e,
    completionRate: completionPct(e.completedTasks, e.assignedTasks),
  }));

  // Task list
  const taskList = tasks.map((t) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline,
    estimatedHours: t.estimatedHours,
    assigneeName: t.assignments[0]?.user.name ?? null,
    hoursLogged: t.workLogs.reduce((s, l) => s + l.hoursWorked, 0),
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description,
      manager: project.manager
        ? { id: project.manager.id, name: project.manager.name, email: project.manager.email }
        : null,
    },
    stats: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      blocked: blockedTasks,
      inProgress: inProgressTasks,
      completionPercentage: completionPct(completedTasks, totalTasks),
    },
    employees,
    taskList,
  };
}

// ── GET /api/reports/employee/:userId ────────────────────────────────────────

export async function getEmployeeReport(
  targetUserId: string,
  requesterId: string,
  role: Role
) {
  if (role === Role.EMPLOYEE) {
    throw new AppError(403, 'Employees cannot access employee reports');
  }

  // PM: target user must be assigned to at least one task in the PM's projects
  if (role === Role.PROJECT_MANAGER) {
    const sharedTask = await prisma.taskAssignment.findFirst({
      where: {
        userId: targetUserId,
        task: {
          deletedAt: null,
          project: { managerId: requesterId, deletedAt: null },
        },
      },
    });
    if (!sharedTask) {
      throw new AppError(403, 'User is not in any of your projects');
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) throw new AppError(404, 'User not found');

  // All task assignments (optionally scoped to PM's projects)
  const projectFilter =
    role === Role.PROJECT_MANAGER
      ? { project: { managerId: requesterId, deletedAt: null } }
      : {};

  const assignments = await prisma.taskAssignment.findMany({
    where: {
      userId: targetUserId,
      task: { deletedAt: null, ...projectFilter },
    },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          status: true,
          deadline: true,
          estimatedHours: true,
          project: { select: { id: true, name: true } },
          workLogs: {
            where: { userId: targetUserId },
            select: { hoursWorked: true },
          },
        },
      },
    },
  });

  const totalAssigned = assignments.length;
  const completed = assignments.filter(
    (a) => a.task.status === TaskStatus.COMPLETED
  ).length;

  const allHours = assignments.reduce(
    (sum, a) => sum + a.task.workLogs.reduce((s, l) => s + l.hoursWorked, 0),
    0
  );

  const taskBreakdown = assignments.map((a) => ({
    taskId: a.task.id,
    taskName: a.task.name,
    projectName: a.task.project.name,
    status: a.task.status,
    hoursLogged: a.task.workLogs.reduce((s, l) => s + l.hoursWorked, 0),
    deadline: a.task.deadline,
  }));

  // Recent activity: last 10 work logs
  const recentActivity = await prisma.workLog.findMany({
    where: {
      userId: targetUserId,
      ...(role === Role.PROJECT_MANAGER
        ? { task: { project: { managerId: requesterId } } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      description: true,
      hoursWorked: true,
      createdAt: true,
      attachmentUrl: true,
      task: { select: { id: true, name: true } },
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    stats: {
      totalAssigned,
      completed,
      completionRate: completionPct(completed, totalAssigned),
      totalHoursLogged: Math.round(allHours * 100) / 100,
      avgHoursPerTask:
        totalAssigned === 0
          ? 0
          : Math.round((allHours / totalAssigned) * 100) / 100,
    },
    recentActivity,
    taskBreakdown,
  };
}

// ── GET /api/reports/overview ─────────────────────────────────────────────────

export async function getOverviewReport(_requesterId: string, role: Role) {
  if (role !== Role.ADMIN) {
    throw new AppError(403, 'Only administrators can view the overview report');
  }

  // Use groupBy for efficiency
  const [
    projectByStatus,
    taskByPriority,
    taskByStatus,
    topEmployeesRaw,
  ] = await Promise.all([
    // Project status breakdown
    prisma.project.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    // Task priority breakdown
    prisma.task.groupBy({
      by: ['priority'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    // Task status breakdown
    prisma.task.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    // Top 5 employees by completed tasks
    prisma.user.findMany({
      where: { role: Role.EMPLOYEE, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        taskAssignments: {
          where: { task: { status: TaskStatus.COMPLETED, deletedAt: null } },
          select: { taskId: true },
        },
        _count: { select: { workLogs: true } },
      },
    }),
  ]);

  // Shape project status breakdown
  const projectStatusBreakdown: Record<string, number> = {
    planning: 0,
    active: 0,
    completed: 0,
    archived: 0,
  };
  for (const g of projectByStatus) {
    projectStatusBreakdown[g.status.toLowerCase()] = g._count._all;
  }

  // Shape task priority breakdown
  const taskPriorityBreakdown: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const g of taskByPriority) {
    taskPriorityBreakdown[g.priority.toLowerCase()] = g._count._all;
  }

  // Shape task status breakdown
  const taskStatusBreakdown: Record<string, number> = {
    todo: 0,
    inProgress: 0,
    inReview: 0,
    completed: 0,
    blocked: 0,
  };
  for (const g of taskByStatus) {
    const key =
      g.status === 'TODO'
        ? 'todo'
        : g.status === 'IN_PROGRESS'
        ? 'inProgress'
        : g.status === 'IN_REVIEW'
        ? 'inReview'
        : g.status === 'COMPLETED'
        ? 'completed'
        : 'blocked';
    taskStatusBreakdown[key] = g._count._all;
  }

  // Top 5 employees sorted by completed task count
  const topEmployees = topEmployeesRaw
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      completedTasks: u.taskAssignments.length,
      totalWorkLogs: u._count.workLogs,
    }))
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 5);

  return {
    projectStatusBreakdown,
    taskPriorityBreakdown,
    taskStatusBreakdown,
    topEmployees,
  };
}

// ── Legacy helpers (kept for backward-compat with old routes) ─────────────────

export class ReportService {
  projectReport = (filters: { projectId?: string }, role: Role, requesterId = '') =>
    filters.projectId
      ? getProjectReport(filters.projectId, requesterId, role)
      : Promise.reject(new AppError(400, 'projectId is required'));

  userReport = (filters: { userId?: string }, role: Role, requesterId = '') =>
    filters.userId
      ? getEmployeeReport(filters.userId, requesterId, role)
      : Promise.reject(new AppError(400, 'userId is required'));

  taskReport = (_filters: { projectId?: string; status?: string }) =>
    Promise.reject(new AppError(410, 'Use /api/reports/project/:projectId instead'));

  overviewReport = (_requesterId: string, role: Role) =>
    getOverviewReport('', role);
}

export const reportService = new ReportService();
