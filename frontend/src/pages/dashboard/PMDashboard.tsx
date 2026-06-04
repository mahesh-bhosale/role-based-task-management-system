import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { FolderKanban, CheckSquare, Clock, ArrowUpDown } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Progress } from '../../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface PMDashboardProps {
  data: {
    managedProjectsCount: number;
    activeTasksCount: number;
    upcomingDeadlines: Array<{
      taskId: string;
      taskName: string;
      deadline: string;
      assigneeName: string | null;
      projectName: string;
      priority: string;
    }>;
    employeeProductivity: Array<{
      employeeId: string;
      employeeName: string;
      assignedTasks: number;
      completedTasks: number;
      completionRate: number;
    }>;
    projectsSummary: Array<{
      projectId: string;
      projectName: string;
      completionPercentage: number;
      taskCount: number;
    }>;
  };
}

export const PMDashboard: React.FC<PMDashboardProps> = ({ data }) => {
  const [sortAsc, setSortAsc] = useState(true);

  const sortedDeadlines = useMemo(() => {
    return [...data.upcomingDeadlines].sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });
  }, [data.upcomingDeadlines, sortAsc]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Managed Projects" value={data.managedProjectsCount} icon={FolderKanban} colorClass="card-3d-purple" textClass="text-royalPurple" />
        <MetricCard title="Active Tasks" value={data.activeTasksCount} icon={CheckSquare} colorClass="card-3d-cyan" textClass="text-cyan" />
        <MetricCard title="Upcoming Deadlines" value={data.upcomingDeadlines.length} icon={Clock} colorClass="card-3d-yellow" textClass="text-vividYellow" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines List */}
        <Card className="card-3d bg-slate-900 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">Upcoming Deadlines (7 Days)</CardTitle>
            <button 
              onClick={() => setSortAsc(!sortAsc)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-sm bg-slate-800 px-2 py-1 rounded transition-colors"
            >
              <ArrowUpDown className="h-3 w-3" />
              Sort
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {sortedDeadlines.map((t, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-white truncate max-w-[200px]">{t.taskName}</p>
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[150px] text-slate-300">{t.projectName}</span>
                    <span className="text-red-400 font-medium whitespace-nowrap">Due: {formatDateTime(t.deadline)}</span>
                  </div>
                  <p className="text-xs text-slate-500">Assignee: <span className="text-slate-400">{t.assigneeName || 'Unassigned'}</span></p>
                </div>
              ))}
              {sortedDeadlines.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No upcoming deadlines.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Projects Progress List */}
          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Projects Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {data.projectsSummary.map(p => (
                  <div key={p.projectId} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-white">{p.projectName}</span>
                      <span className="text-slate-400">{p.completionPercentage.toFixed(0)}% ({p.taskCount} tasks)</span>
                    </div>
                    <Progress value={p.completionPercentage} className="h-2" />
                  </div>
                ))}
                {data.projectsSummary.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No active projects managed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employee Productivity Table */}
          <Card className="card-3d bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Employee Productivity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <Table>
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-center text-slate-300">Assigned</TableHead>
                    <TableHead className="text-center text-slate-300">Completed</TableHead>
                    <TableHead className="text-right text-slate-300">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employeeProductivity.map(emp => (
                    <TableRow key={emp.employeeId} className="border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-medium text-slate-200">{emp.employeeName}</TableCell>
                      <TableCell className="text-center text-slate-400">{emp.assignedTasks}</TableCell>
                      <TableCell className="text-center text-emerald-500 font-medium">{emp.completedTasks}</TableCell>
                      <TableCell className="text-right text-primary font-bold">{emp.completionRate.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                  {data.employeeProductivity.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center text-slate-500 py-6">No employee data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
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
