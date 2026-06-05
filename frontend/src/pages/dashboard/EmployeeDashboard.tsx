import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AlertCircle, CheckSquare, Clock, BarChart3, Activity } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface EmployeeDashboardProps {
  data: {
    tasksByStatus: {
      todo: number;
      inProgress: number;
      inReview: number;
      completed: number;
      blocked: number;
    };
    dueSoonTasks: Array<{
      id: string;
      name: string;
      priority: string;
      deadline: string | Date | null;
      projectName: string;
    }>;
    recentlyCompletedTasks: Array<any>;
    recentWorklogs: Array<{
      id: string;
      taskName: string;
      hoursWorked: number;
      description: string;
      createdAt: string;
    }>;
    totalHoursThisWeek: number;
  };
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data }) => {
  const statusData = useMemo(() => {
    return [
      { name: 'To Do', value: data.tasksByStatus.todo, color: '#94a3b8' },
      { name: 'In Progress', value: data.tasksByStatus.inProgress, color: '#3b82f6' },
      { name: 'In Review', value: data.tasksByStatus.inReview, color: '#f59e0b' },
      { name: 'Completed', value: data.tasksByStatus.completed, color: '#10b981' },
      { name: 'Blocked', value: data.tasksByStatus.blocked, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [data.tasksByStatus]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Tasks Due Soon" value={data.dueSoonTasks.length} icon={AlertCircle} colorClass="card-3d-orange" textClass="text-neonOrange" />
        <MetricCard title="To Do" value={data.tasksByStatus.todo} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
        <MetricCard title="In Progress" value={data.tasksByStatus.inProgress} icon={Activity} colorClass="card-3d-purple" textClass="text-royalPurple" />
        <MetricCard title="Hours Logged (Week)" value={data.totalHoursThisWeek.toFixed(1)} icon={BarChart3} colorClass="card-3d-emerald" textClass="text-brightEmerald" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks Due Soon */}
        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Due Soon (Next 48h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-2">
              {(data.dueSoonTasks ?? []).map((t) => (
                <div key={t.id} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white">{t.name}</p>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.projectName}</span>
                    {t.deadline && <Countdown deadline={String(t.deadline)} />}
                  </div>
                </div>
              ))}
              {(data.dueSoonTasks ?? []).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No tasks due soon. Great job!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Status Breakdown */}
        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex justify-center items-center text-slate-500">No active tasks</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Work Logs */}
        <Card className="card-3d bg-slate-900 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Recent Work Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(data.recentWorklogs ?? []).map((log) => (
                <div key={log.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-800 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-slate-200 text-sm truncate pr-2">{log.taskName}</p>
                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded shrink-0">
                      {log.hoursWorked}h
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">{log.description}</p>
                  <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              ))}
              {(data.recentWorklogs ?? []).length === 0 && (
                <div className="col-span-full text-center py-6 text-slate-500">You haven't logged any work recently.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Countdown = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      if (difference <= 0) return 'Overdue';
      
      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `Due in ${days}d ${hours % 24}h`;
      }
      return `Due in ${hours}h ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  return <span className={`font-medium ${timeLeft === 'Overdue' ? 'text-red-500' : 'text-neonOrange'}`}>{timeLeft}</span>;
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
