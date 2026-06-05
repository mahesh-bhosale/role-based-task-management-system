import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useDeleteTask } from '../../hooks/useTasks';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PriorityBadge } from '../../components/shared/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Plus, CheckSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ROLES, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../lib/constants';
import { Task } from '../../types/api.types';
import { formatDateTime } from '../../lib/utils';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export const TasksPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', assigneeName: '', search: '', deadlineBefore: '' });
  
  const { data, isLoading } = useTasks({ page, limit: 10, ...filters });
  const deleteTask = useDeleteTask();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const canCreate = user?.role === ROLES.ADMIN || user?.role === ROLES.PROJECT_MANAGER;

  const handleDelete = async () => {
    if (taskToDelete) {
      await deleteTask.mutateAsync(taskToDelete);
      setTaskToDelete(null);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as keyof Task, className: 'font-medium text-white max-w-[200px] truncate' },
    { 
      header: 'Project', 
      cell: (t: Task) => <span className="text-slate-300 truncate max-w-[150px] inline-block">{t.project?.name}</span> 
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
      header: 'Assignee', 
      cell: (t: Task) => <span className="text-slate-300">{t.assignments?.[0]?.user?.name || t.assignee?.name || 'Unassigned'}</span> 
    },
    { 
      header: 'Deadline', 
      cell: (t: Task) => {
        const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED';
        return <span className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>{formatDateTime(t.deadline)}</span>;
      }
    },
    {
      header: '',
      className: 'w-[50px]',
      cell: (t: Task) => (
        canCreate && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem onClick={() => navigate(`/tasks/${t.id}/edit`)} className="text-slate-300 cursor-pointer focus:bg-slate-800 focus:text-white">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTaskToDelete(t.id)} className="text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      )
    }
  ];

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

      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
        <div className="text-sm text-slate-400 flex items-center">Filters:</div>
        <select 
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select 
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none"
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        >
          <option value="">All Priorities</option>
          {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {canCreate && (
          <input 
            type="text" 
            placeholder="Assignee Name" 
            className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none w-[180px]" 
            value={filters.assigneeName}
            onChange={(e) => setFilters({ ...filters, assigneeName: e.target.value })}
          />
        )}
        <input 
          type="text" 
          placeholder="Search task name..." 
          className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none w-[180px]" 
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Deadline Before:</span>
          <input 
            type="date" 
            className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none" 
            value={filters.deadlineBefore}
            onChange={(e) => setFilters({ ...filters, deadlineBefore: e.target.value })}
          />
        </div>
      </div>

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
          onRowClick={(t) => navigate(`/tasks/${t.id}`)}
        />
      )}

      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? Associated work logs will also be removed."
        variant="destructive"
        isLoading={deleteTask.isPending}
      />
    </PageWrapper>
  );
};
