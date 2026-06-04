import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useDeleteProject } from '../../hooks/useProjects';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';
import { Plus, FolderKanban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ROLES, PROJECT_STATUS_LABELS } from '../../lib/constants';
import { Project } from '../../types/api.types';
import { EmptyState } from '../../components/shared/EmptyState';
import { Progress } from '../../components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

export const ProjectsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjects({ page, limit: 10 });
  const deleteProject = useDeleteProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const canCreate = user?.role === ROLES.ADMIN;

  const handleDelete = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as keyof Project, className: 'font-medium text-white max-w-[200px] truncate' },
    { 
      header: 'Status', 
      cell: (p: Project) => <StatusBadge status={p.status} type="project" /> 
    },
    { 
      header: 'Manager', 
      cell: (p: Project) => <span className="text-slate-300">{p.manager?.name || 'Unassigned'}</span> 
    },
    { 
      header: 'Dates', 
      cell: (p: Project) => (
        <div className="flex flex-col text-xs text-slate-400">
          <span>Start: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span>
          <span>End: {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      ) 
    },
    { 
      header: 'Tasks', 
      cell: (p: Project) => (
        <div className="w-[100px]">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Tasks:</span>
            <span>{p._count?.tasks || 0}</span>
          </div>
          <Progress value={p._count?.tasks && p._count.tasks > 0 ? 50 : 0} className="h-1.5 bg-slate-800" />
        </div>
      )
    },
    {
      header: '',
      className: 'w-[50px]',
      cell: (p: Project) => (
        canCreate && (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem onClick={() => navigate(`/projects/${p.id}/edit`)} className="text-slate-300 cursor-pointer focus:bg-slate-800 focus:text-white">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectToDelete(p.id)} className="text-red-400 cursor-pointer focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      )
    }
  ];

  const handleRowClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <PageWrapper>
      <PageHeader 
        title="Projects" 
        description="Manage your projects and their overall progress."
        action={canCreate ? (
          <Button onClick={() => navigate('/projects/new')} className="bg-primary text-primary-foreground font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        ) : null}
      />

      {/* Filter Bar Placeholder */}
      <div className="flex gap-4 mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
        <div className="text-sm text-slate-400">Filters:</div>
        <select className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-2">
          <option value="">All Statuses</option>
          {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="text" placeholder="Manager Name" className="bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded px-2 py-1" />
      </div>

      {data?.items.length === 0 && !isLoading ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={canCreate ? "Get started by creating a new project." : "You don't have access to any active projects right now."}
          actionLabel={canCreate ? "Create Project" : undefined}
          onAction={canCreate ? () => navigate('/projects/new') : undefined}
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

      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks."
        variant="destructive"
        isLoading={deleteProject.isPending}
      />
    </PageWrapper>
  );
};
