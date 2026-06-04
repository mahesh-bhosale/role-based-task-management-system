import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { DataTable } from '../../components/shared/DataTable';
import { ArrowLeft, Pencil, CheckCircle } from 'lucide-react';
import { ROLES } from '../../lib/constants';
import { Task } from '../../types/api.types';
import { formatDateTime } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: isLoadingProject } = useProject(id!);
  const { data: tasksRes, isLoading: isLoadingTasks } = useTasks({ projectId: id, limit: 100 });
  const updateProject = useUpdateProject();
  const { user } = useAuth();
  
  const tasks = tasksRes?.items || [];
  
  const [activeTab, setActiveTab] = useState('tasks');

  if (isLoadingProject || isLoadingTasks) {
    return <PageWrapper><LoadingSpinner size={48} /></PageWrapper>;
  }

  if (!project) {
    return <PageWrapper><div className="text-red-500">Project not found.</div></PageWrapper>;
  }

  const canEdit = user?.role === ROLES.ADMIN || (user?.role === ROLES.PROJECT_MANAGER && user?.id === project.managerId);

  const handleArchive = async () => {
    await updateProject.mutateAsync({ id: project.id, data: { status: 'ARCHIVED' } });
  };

  const taskColumns = [
    { header: 'Name', accessorKey: 'name' as keyof Task, className: 'font-medium text-white' },
    { header: 'Priority', cell: (t: Task) => <PriorityBadge priority={t.priority} /> },
    { header: 'Status', cell: (t: Task) => <StatusBadge status={t.status} type="task" /> },
    { header: 'Assignee', cell: (t: Task) => <span className="text-slate-300">{t.assignee?.name || 'Unassigned'}</span> },
    { header: 'Deadline', cell: (t: Task) => <span className="text-slate-400">{formatDateTime(t.deadline)}</span> },
  ];

  return (
    <PageWrapper>
      <div className="mb-6">
        <button 
          onClick={() => navigate('/projects')}
          className="flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <StatusBadge status={project.status} type="project" />
            </div>
            <p className="text-slate-400 mt-2 max-w-2xl">{project.description}</p>
          </div>
          
          {canEdit && (
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/projects/${project.id}/edit`)} variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-white">
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              {project.status !== 'ARCHIVED' && (
                <Button onClick={handleArchive} variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white">
                  <CheckCircle className="h-4 w-4 mr-2" /> Archive
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Overall Progress</span>
              <span>{project._count?.tasks || 0} tasks</span>
            </div>
            <Progress value={project.completionPercentage || 0} className="h-2" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-900 border-b border-slate-800 w-full justify-start rounded-none p-0 h-auto">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 text-slate-400">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 text-slate-400">
            Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="pt-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Project Tasks</h2>
            {canEdit && (
              <Button onClick={() => navigate('/tasks/new')} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
                Add Task
              </Button>
            )}
          </div>
          <DataTable 
            data={tasks} 
            columns={taskColumns} 
            onRowClick={(task) => navigate(`/tasks/${task.id}`)}
          />
        </TabsContent>
        
        <TabsContent value="details" className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-3d bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-slate-300">{project.description || 'No description provided.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Start Date</span>
                    <p className="text-slate-300">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">End Date</span>
                    <p className="text-slate-300">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-3d bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Project Manager</span>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                      {project.manager?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{project.manager?.name || 'Unassigned'}</p>
                      <p className="text-xs text-slate-400">{project.manager?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
