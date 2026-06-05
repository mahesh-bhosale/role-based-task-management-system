import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Skeleton } from '../../components/ui/skeleton';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOverviewReport } from '../../hooks/useReports';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ReportsOverviewPage: React.FC = () => {
  const { data: report, isLoading } = useOverviewReport();

  if (isLoading) {
    return (
      <PageWrapper title="Reports Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full md:col-span-2" />
        </div>
      </PageWrapper>
    );
  }

  if (!report) return null;

  const projectStatusData = Object.entries(report.projectStatusBreakdown).map(([name, count]) => ({ name, count }));
  const taskPriorityData = Object.entries(report.taskPriorityBreakdown).map(([name, count]) => ({ name, count }));

  return (
    <PageWrapper title="Reports Overview" description="High-level metrics across all projects and personnel.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStatusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  {projectStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {taskPriorityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Top Employees</CardTitle>
          <CardDescription>Leaderboard based on task completion rate and hours logged.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-2 border-slate-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-800">
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Completed Tasks</TableHead>
                  <TableHead>Total Work Logs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.topEmployees.map((emp, index) => (
                  <TableRow key={emp.id} className="hover:bg-slate-800/50">
                    <TableCell className="font-bold text-slate-400">#{index + 1}</TableCell>
                    <TableCell className="font-medium text-slate-200">{emp.name}</TableCell>
                    <TableCell>{emp.completedTasks}</TableCell>
                    <TableCell>{emp.totalWorkLogs}</TableCell>
                  </TableRow>
                ))}
                {report.topEmployees.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-6">No data available.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default ReportsOverviewPage;
