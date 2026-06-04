import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { FolderKanban, CheckSquare, Users, AlertCircle, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { formatDateTime } from '../../lib/utils';
import { PROJECT_STATUS_LABELS } from '../../lib/constants';

interface AdminDashboardProps {
  data: {
    totalProjects: number;
    totalTasks: number;
    activeEmployees: number;
    overdueTasks: number;
    completedTasks: number;
    projectsOverview: Array<{
      id: string;
      name: string;
      status: string;
      completionPercentage: number;
      managerName: string | null;
      taskCount: number;
    }>;
    recentAuditLogs: Array<{
      id: string;
      action: string;
      entity: string;
      createdAt: string;
      user?: { name: string };
    }>;
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  // Aggregate projects by status from projectsOverview (which returns 10 recent, but good enough for chart)
  const projectsByStatus = useMemo(() => {
    const counts = data.projectsOverview.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([status, count]) => ({
      name: PROJECT_STATUS_LABELS[status] || status,
      value: count,
      color: getStatusColor(status),
    }));
  }, [data.projectsOverview]);

  // Tasks by status derivation from available metrics
  const tasksByStatus = useMemo(() => {
    const otherTasks = Math.max(0, data.totalTasks - data.completedTasks - data.overdueTasks);
    return [
      { name: 'Completed', value: data.completedTasks, fill: '#10b981' },
      { name: 'Overdue', value: data.overdueTasks, fill: '#ef4444' },
      { name: 'Other', value: otherTasks, fill: '#64748b' },
    ].filter(d => d.value > 0);
  }, [data]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 5 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Projects" value={data.totalProjects} icon={FolderKanban} colorClass="card-3d-purple" textClass="text-royalPurple" />
        <MetricCard title="Total Tasks" value={data.totalTasks} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
        <MetricCard title="Active Employees" value={data.activeEmployees} icon={Users} colorClass="card-3d-emerald" textClass="text-brightEmerald" />
        <MetricCard title="Completed Tasks" value={data.completedTasks} icon={CheckSquare} colorClass="card-3d-yellow" textClass="text-vividYellow" />
        <MetricCard title="Overdue Tasks" value={data.overdueTasks} icon={AlertCircle} colorClass="card-3d-pink" textClass="text-electricPink" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Projects by Status BarChart */}
        <Card className="card-3d bg-slate-900 border-slate-700 col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Recent Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              {projectsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsByStatus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {projectsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No projects found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Status PieChart */}
        <Card className="card-3d bg-slate-900 border-slate-700 col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Tasks Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {tasksByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No tasks found</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="card-3d bg-slate-900 border-slate-700 col-span-1 lg:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Recent Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {data.recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <ShieldAlert className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-200">
                      <span className="font-medium text-white">{log.user?.name || 'System'}</span> {log.action.replace(/_/g, ' ')} <span className="font-medium">{log.entity}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))}
              {data.recentAuditLogs.length === 0 && (
                <div className="text-center text-slate-500 py-8">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, colorClass, textClass }: any) => (
  <Card className={`${colorClass} border-slate-700 relative overflow-hidden group`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <CardContent className="p-5 flex items-center justify-between">
      <div className="z-10">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${textClass}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-slate-950/50 z-10 border border-white/5`}>
        <Icon className={`h-6 w-6 ${textClass}`} />
      </div>
    </CardContent>
  </Card>
);

function getStatusColor(status: string) {
  switch (status) {
    case 'PLANNING': return '#a855f7';
    case 'ACTIVE': return '#3b82f6';
    case 'ON_HOLD': return '#f59e0b';
    case 'COMPLETED': return '#10b981';
    case 'ARCHIVED': return '#64748b';
    default: return '#cbd5e1';
  }
}
