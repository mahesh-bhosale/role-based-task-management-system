import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useTaskWorklogs } from '../../hooks/useWorklogs';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { Clock, ChevronRight, FolderOpen } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';

// Fetches worklogs for a single assigned task
const TaskWorklogSection: React.FC<{ taskId: string; taskName: string; projectName: string }> = ({
  taskId,
  taskName,
  projectName,
}) => {
  const { data, isLoading } = useTaskWorklogs(taskId, { limit: 50 });
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (!data?.items?.length) return null;

  return (
    <Card className="card-3d bg-slate-900 border-slate-700">
      <CardHeader
        className="cursor-pointer hover:bg-slate-800/40 rounded-t-xl transition-colors"
        onClick={() => navigate(`/tasks/${taskId}`)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-base">{taskName}</CardTitle>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <FolderOpen className="h-3 w-3" /> {projectName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-900/50 text-blue-200 border border-blue-800">
              {data.items.length} log{data.items.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="secondary" className="bg-emerald-900/50 text-emerald-200 border border-emerald-800">
              {data.items.reduce((sum, l: any) => sum + l.hoursWorked, 0).toFixed(1)}h total
            </Badge>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y divide-slate-800">
          {data.items.map((log: any) => (
            <div key={log.id} className="py-3 flex items-start gap-4">
              <div className="shrink-0 bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded mt-0.5">
                {log.hoursWorked}h
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 line-clamp-2">{log.description}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
              {log._count?.replies > 0 && (
                <Badge variant="secondary" className="shrink-0 bg-slate-800 text-slate-300 border border-slate-700 text-xs">
                  {log._count.replies} repl{log._count.replies === 1 ? 'y' : 'ies'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const MyWorkLogsPage: React.FC = () => {
  const [page] = useState(1);

  // Fetch employee's assigned tasks
  const { data: tasksData, isLoading: tasksLoading } = useTasks({ page, limit: 100 });

  const assignedTasks = tasksData?.items ?? [];
  const totalHours = 0; // computed per-task

  return (
    <PageWrapper>
      <PageHeader
        title="My Work Logs"
        description="View all hours you've logged across your assigned tasks."
      />

      {tasksLoading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size={48} />
        </div>
      ) : assignedTasks.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No tasks assigned"
          description="You don't have any tasks assigned yet. Work logs will appear here once you're assigned to tasks."
        />
      ) : (
        <div className="space-y-4">
          {assignedTasks.map((task: any) => (
            <TaskWorklogSection
              key={task.id}
              taskId={task.id}
              taskName={task.name}
              projectName={task.project?.name ?? 'Unknown Project'}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default MyWorkLogsPage;
