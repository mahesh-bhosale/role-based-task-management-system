export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'EMPLOYEE';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  managerId: string | null;
  manager?: { id: string; name: string; email: string } | null;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completionPercentage?: number;
  _count?: { tasks: number };
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedById: string;
  assignedAt: string;
  user?: { id: string; name: string; email: string };
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string | null;
  estimatedHours: number | null;
  projectId: string;
  createdById: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  assignments?: TaskAssignment[];
  workLogsCount?: number;
  assignee?: { id: string; name: string; email?: string };
  assigneeId?: string;
  createdBy?: { id: string; name: string; email?: string };
  auditLogs?: AuditLog[];
}

export interface LogReply {
  id: string;
  message: string;
  workLogId: string;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface WorkLog {
  id: string;
  description: string;
  hoursWorked: number;
  attachmentUrl: string | null;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  task?: { id: string; name: string; project?: { id: string; name: string } };
  user?: { id: string; name: string; email: string };
  replies?: LogReply[];
  _count?: { replies: number };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  entityId: string | null;
  sentAt: string;
  status: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalHoursWorked?: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Dashboard types
export interface AdminDashboardData {
  totalProjects: number;
  totalTasks: number;
  activeEmployees: number;
  overdueTasks: number;
  completedTasks: number;
  projectsOverview: {
    id: string;
    name: string;
    status: ProjectStatus;
    completionPercentage: number;
    managerName: string | null;
    taskCount: number;
  }[];
  recentAuditLogs: AuditLog[];
}

export interface PMDashboardData {
  managedProjectsCount: number;
  activeTasksCount: number;
  upcomingDeadlines: {
    taskName: string;
    deadline: string;
    priority: TaskPriority;
    projectName: string;
    assigneeName: string | null;
  }[];
  employeeProductivity: {
    employeeName: string;
    assignedTasks: number;
    completedTasks: number;
    completionRate: number;
  }[];
  projectsSummary: {
    id: string;
    name: string;
    status: ProjectStatus;
    completionPercentage: number;
    taskCounts: { total: number; completed: number; pending: number; blocked: number };
  }[];
}

export interface EmployeeDashboardData {
  tasksByStatus: {
    todo: number;
    inProgress: number;
    inReview: number;
    completed: number;
    blocked: number;
  };
  dueSoonTasks: {
    id: string;
    name: string;
    deadline: string;
    priority: TaskPriority;
    projectName: string;
  }[];
  recentlyCompletedTasks: {
    id: string;
    name: string;
    updatedAt: string;
    project: { name: string };
  }[];
  recentWorkLogs: WorkLog[];
  totalHoursThisWeek: number;
}

export type DashboardData = AdminDashboardData | PMDashboardData | EmployeeDashboardData;

// Report types
export interface ProjectReport {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    manager: { id: string; name: string; email: string } | null;
  };
  stats: {
    total: number;
    completed: number;
    pending: number;
    blocked: number;
    inProgress: number;
    completionPercentage: number;
  };
  employees: {
    id: string;
    name: string;
    email: string;
    assignedTasks: number;
    completedTasks: number;
    hoursLogged: number;
    completionRate: number;
  }[];
  taskList: {
    id: string;
    name: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string | null;
    estimatedHours: number | null;
    assigneeName: string | null;
    hoursLogged: number;
  }[];
}

export interface EmployeeReport {
  user: { id: string; name: string; email: string; role: Role; isActive: boolean };
  stats: {
    totalAssigned: number;
    completed: number;
    completionRate: number;
    totalHoursLogged: number;
    avgHoursPerTask: number;
  };
  recentActivity: WorkLog[];
  taskBreakdown: {
    taskId: string;
    taskName: string;
    projectName: string;
    status: TaskStatus;
    hoursLogged: number;
    deadline: string | null;
  }[];
}

export interface OverviewReport {
  projectStatusBreakdown: Record<string, number>;
  taskPriorityBreakdown: Record<string, number>;
  taskStatusBreakdown: Record<string, number>;
  topEmployees: {
    id: string;
    name: string;
    email: string;
    completedTasks: number;
    totalWorkLogs: number;
  }[];
}
