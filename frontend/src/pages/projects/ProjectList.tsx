import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useAuth } from '../../context/AuthContext';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/button';
import { Plus, FolderKanban } from 'lucide-react';
import { ROLES } from '../../lib/constants';
import { Project } from '../../types/api.types';
import { formatDateTime } from '../../lib/utils';
import { EmptyState } from '../../components/shared/EmptyState';

export const ProjectList: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProjects({ page, limit: 10 });
  const { user } = useAuth();
  const navigate = useNavigate();

  const columns = [
    { header: 'Name', accessorKey: 'name' as keyof Project, className: 'font-medium text-white' },
    { 
      header: 'Status', 
      cell: (p: Project) => <StatusBadge status={p.status} type="project" /> 
    },
    { 
      header: 'Manager', 
      cell: (p: Project) => <span className="text-slate-300">{p.manager?.name || 'Unassigned'}</span> 
    },
    { header: 'Tasks', cell: (p: Project) => p._count?.tasks || 0 },
    { 
      header: 'Created At', 
      cell: (p: Project) => <span className="text-slate-400">{formatDateTime(p.createdAt)}</span> 
    },
  ];

  const canCreate = user?.role === ROLES.ADMIN;

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
    </PageWrapper>
  );
};
