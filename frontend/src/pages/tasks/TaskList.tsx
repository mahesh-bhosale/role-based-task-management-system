import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Plus, CheckSquare } from 'lucide-react';
import { ROLES } from '../../lib/constants';
import { Task } from '../../types/api.types';
import { formatDateTime } from '../../lib/utils';
import { EmptyState } from '../../components/shared/EmptyState';

export const TaskList: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTasks({ page, limit: 10 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const columns = [
    { header: 'Name', accessorKey: 'name' as keyof Task, className: 'font-medium text-white' },
    { 
      header: 'Project', 
      cell: (t: Task) => <span className="text-slate-300">{t.project?.name}</span> 
    },
    { 
      header: 'Priority', 
      cell: (t: Task) => <PriorityBadge priority={t.priority} /> 
    },
    { 
      header: 'Status', 
      cell: (t: Task) => <StatusBadge status={t.status} type="task" /> 
    },
    { 
      header: 'Deadline', 
      cell: (t: Task) => <span className={`text-sm ${t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED' ? 'text-red-400 font-medium' : 'text-slate-400'}`}>{formatDateTime(t.deadline)}</span> 
    },
  ];

  const canCreate = user?.role === ROLES.ADMIN || user?.role === ROLES.PROJECT_MANAGER;

  const handleRowClick = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <PageWrapper>
      <PageHeader 
        title="Tasks" 
        description="View and manage tasks across projects."
        action={canCreate ? (
          <Button onClick={() => navigate('/tasks/new')} className="bg-primary text-primary-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        ) : null}
      />

      {data?.items.length === 0 && !isLoading ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={canCreate ? "Create a task and assign it to an employee." : "You have no tasks assigned currently."}
          actionLabel={canCreate ? "Create Task" : undefined}
          onAction={canCreate ? () => navigate('/tasks/new') : undefined}
        />
      ) : (
        <DataTable 
          data={data?.items || []} 
          columns={columns} 
          isLoading={isLoading} 
          page={data?.meta?.page || 1}
          totalPages={data?.meta?.totalPages || 1}
          onPageChange={setPage}
          onRowClick={handleRowClick}
        />
      )}
    </PageWrapper>
  );
};
