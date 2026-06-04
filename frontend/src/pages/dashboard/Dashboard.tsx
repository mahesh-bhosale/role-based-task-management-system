import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ROLES, PROJECT_STATUS_LABELS } from '../../lib/constants';
import { FolderKanban, CheckSquare, Users, AlertCircle, Clock, ShieldAlert, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatDateTime, truncate } from '../../lib/utils';
import { PriorityBadge } from '../../components/shared/PriorityBadge';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) return <PageWrapper><LoadingSpinner size={48} /></PageWrapper>;
  if (error || !dashboard) return <PageWrapper><div className="text-red-500">Failed to load dashboard</div></PageWrapper>;

  const role = user?.role;

  return (
    <PageWrapper>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user?.name}. Here's what's happening.`} 
      />

      {role === ROLES.ADMIN && <AdminDashboard data={dashboard as any} />}
      {role === ROLES.PROJECT_MANAGER && <PMDashboard data={dashboard as any} />}
      {role === ROLES.EMPLOYEE && <EmployeeDashboard data={dashboard as any} />}
      
    </PageWrapper>
  );
};

const AdminDashboard = ({ data }: { data: any }) => (
  <div className="space-y-8">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard title="Total Projects" value={data.totalProjects} icon={FolderKanban} colorClass="card-3d-purple" textClass="text-royalPurple" />
      <MetricCard title="Total Tasks" value={data.totalTasks} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
      <MetricCard title="Active Employees" value={data.activeEmployees} icon={Users} colorClass="card-3d-emerald" textClass="text-brightEmerald" />
      <MetricCard title="Overdue Tasks" value={data.overdueTasks} icon={AlertCircle} colorClass="card-3d-pink" textClass="text-electricPink" />
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <Card className="card-3d bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Projects Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.projectsOverview.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">{PROJECT_STATUS_LABELS[p.status]}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{p.completionPercentage.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">{p.taskCount} tasks</p>
                </div>
              </div>
            ))}
            {data.projectsOverview.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No projects available</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="card-3d bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentAuditLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                <ShieldAlert className="h-4 w-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-sm text-slate-200">
                    <span className="font-medium text-white">{log.user?.name || 'System'}</span> {log.action} <span className="font-medium">{log.entity}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const PMDashboard = ({ data }: { data: any }) => (
  <div className="space-y-8">
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard title="Managed Projects" value={data.managedProjectsCount} icon={FolderKanban} colorClass="card-3d-purple" textClass="text-royalPurple" />
      <MetricCard title="Active Tasks" value={data.activeTasksCount} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
      <MetricCard title="Upcoming Deadlines" value={data.upcomingDeadlines.length} icon={Clock} colorClass="card-3d-yellow" textClass="text-vividYellow" />
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <Card className="card-3d bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Deadlines (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.upcomingDeadlines.map((t: any, i: number) => (
              <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-white">{t.taskName}</p>
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{t.projectName}</span>
                  <span className="text-red-400 font-medium">Due: {formatDateTime(t.deadline)}</span>
                </div>
                <p className="text-xs text-slate-500">Assignee: {t.assigneeName || 'Unassigned'}</p>
              </div>
            ))}
            {data.upcomingDeadlines.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="card-3d bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Employee Productivity</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.employeeProductivity} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="employeeName" type="category" stroke="#94a3b8" width={100} tickFormatter={(v) => truncate(v, 10)} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="completedTasks" name="Completed" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="assignedTasks" name="Total Assigned" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const EmployeeDashboard = ({ data }: { data: any }) => {
  const statusData = [
    { name: 'To Do', value: data.tasksByStatus.todo, color: '#64748b' },
    { name: 'In Progress', value: data.tasksByStatus.inProgress, color: '#3b82f6' },
    { name: 'In Review', value: data.tasksByStatus.inReview, color: '#a855f7' },
    { name: 'Completed', value: data.tasksByStatus.completed, color: '#10b981' },
    { name: 'Blocked', value: data.tasksByStatus.blocked, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Tasks Due Soon" value={data.dueSoonTasks.length} icon={AlertCircle} colorClass="card-3d-orange" textClass="text-neonOrange" />
        <MetricCard title="To Do" value={data.tasksByStatus.todo} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
        <MetricCard title="In Progress" value={data.tasksByStatus.inProgress} icon={Clock} colorClass="card-3d-purple" textClass="text-royalPurple" />
        <MetricCard title="Hours Logged (Week)" value={data.totalHoursThisWeek.toFixed(1)} icon={BarChart3} colorClass="card-3d-emerald" textClass="text-brightEmerald" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tasks Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.dueSoonTasks.map((t: any) => (
                <div key={t.id} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white">{t.name}</p>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.projectName}</span>
                    <span className="text-red-400 font-medium">{formatDateTime(t.deadline)}</span>
                  </div>
                </div>
              ))}
              {data.dueSoonTasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No tasks due soon. Great job!</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, colorClass, textClass }: any) => (
  <Card className={`${colorClass} border-slate-700`}>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${textClass}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-slate-800`}>
        <Icon className={`h-6 w-6 ${textClass}`} />
      </div>
    </CardContent>
  </Card>
);
