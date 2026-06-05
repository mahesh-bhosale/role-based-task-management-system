import React, { useState } from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useProjects } from '../../hooks/useProjects';
import { useUsers } from '../../hooks/useUsers';
import { useProjectReport, useEmployeeReport } from '../../hooks/useReports';
import { format } from 'date-fns';
import { CheckCircle2, Clock, ListTodo, AlertCircle } from 'lucide-react';

const ProjectReportTab: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('');
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: report, isLoading } = useProjectReport(projectId);

  const chartData = report ? [
    { name: 'TODO', count: report.stats.pending },
    { name: 'IN_PROGRESS', count: report.stats.inProgress },
    { name: 'COMPLETED', count: report.stats.completed },
    { name: 'BLOCKED', count: report.stats.blocked },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-slate-300">Select Project:</label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-[300px] border-2 border-slate-700 bg-slate-800">
            <SelectValue placeholder="Choose a project..." />
          </SelectTrigger>
          <SelectContent>
            {projectsData?.items.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}
      
      {!isLoading && report && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-1">
              <CardContent className="pt-6 text-center">
                <div className="text-5xl font-bold text-blue-500 mb-2">
                  {report.stats.completionPercentage.toFixed(0)}%
                </div>
                <p className="text-slate-400 font-medium">Completion</p>
                <Progress value={report.stats.completionPercentage} className="h-2 mt-4" />
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Task Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border-2 border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-800">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Hours Logged</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.employees.map(emp => (
                      <TableRow key={emp.id} className="hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-200">{emp.name}</TableCell>
                        <TableCell>{emp.assignedTasks}</TableCell>
                        <TableCell>{emp.completedTasks}</TableCell>
                        <TableCell>{emp.hoursLogged.toFixed(1)}h</TableCell>
                        <TableCell>
                          <Badge variant={emp.completionRate === 100 ? "default" : "secondary"} className={emp.completionRate === 100 ? "bg-green-600" : "bg-blue-900/50"}>
                            {emp.completionRate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {report.employees.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-6">No team members assigned.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const EmployeeReportTab: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: report, isLoading } = useEmployeeReport(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-slate-300">Select Employee:</label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger className="w-[300px] border-2 border-slate-700 bg-slate-800">
            <SelectValue placeholder="Choose an employee..." />
          </SelectTrigger>
          <SelectContent>
            {usersData?.items.filter(u => u.role !== 'ADMIN').map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && report && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Completion Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.stats.completionRate.toFixed(0)}%</div>
                <p className="text-xs text-slate-500 mt-1">Overall</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.stats.totalHoursLogged.toFixed(1)}h</div>
                <p className="text-xs text-slate-500 mt-1">Logged across all tasks</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Tasks Completed</CardTitle>
                <ListTodo className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.stats.completed} / {report.stats.totalAssigned}</div>
                <p className="text-xs text-slate-500 mt-1">Assigned tasks</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Hours / Task</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.stats.avgHoursPerTask.toFixed(1)}h</div>
                <p className="text-xs text-slate-500 mt-1">On completed tasks</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest work logs submitted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {report.recentActivity.map(log => (
                    <div key={log.id} className="flex flex-col space-y-1 pb-4 border-b border-slate-800 last:border-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-blue-400">{log.task?.name}</span>
                        <span className="text-xs text-slate-500">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{log.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-semibold text-slate-500">{log.task?.project?.name}</span>
                        <Badge variant="outline" className="text-xs">{log.hoursWorked}h</Badge>
                      </div>
                    </div>
                  ))}
                  {report.recentActivity.length === 0 && (
                    <div className="text-center text-slate-500 py-4">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-700 bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader>
                <CardTitle>Task Breakdown</CardTitle>
                <CardDescription>All assigned tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border-2 border-slate-700 overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-800 sticky top-0">
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.taskBreakdown.map(task => (
                        <TableRow key={task.taskId} className="hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-200">
                            {task.taskName}
                            <div className="text-xs text-slate-500">{task.projectName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={task.status === 'COMPLETED' ? 'text-green-400 border-green-800' : ''}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.hoursLogged}h</TableCell>
                        </TableRow>
                      ))}
                      {report.taskBreakdown.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-4">No tasks assigned</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  return (
    <PageWrapper title="Detailed Reports" description="Dive deep into project and employee performance.">
      <Tabs defaultValue="project" className="space-y-6">
        <TabsList className="bg-slate-900 border-2 border-slate-700">
          <TabsTrigger value="project" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Project Reports</TabsTrigger>
          <TabsTrigger value="employee" className="data-[state=active]:bg-slate-800 data-[state=active]:text-blue-400">Employee Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="project" className="m-0">
          <ProjectReportTab />
        </TabsContent>
        <TabsContent value="employee" className="m-0">
          <EmployeeReportTab />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};

export default ReportsPage;
