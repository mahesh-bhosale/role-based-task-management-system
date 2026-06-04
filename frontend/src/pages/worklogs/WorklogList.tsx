import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorklogs } from '../../hooks/useWorklogs';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { Clock } from 'lucide-react';
import { WorkLog } from '../../types/api.types';
import { formatDateTime } from '../../lib/utils';
import { EmptyState } from '../../components/shared/EmptyState';

export const WorklogList: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWorklogs({ page, limit: 10 });
  const navigate = useNavigate();

  const columns = [
    { 
      header: 'Task', 
      cell: (w: WorkLog) => (
        <div>
          <p className="font-medium text-white">{w.task?.name}</p>
          <p className="text-xs text-slate-400">{w.task?.project?.name}</p>
        </div>
      ) 
    },
    { 
      header: 'User', 
      cell: (w: WorkLog) => <span className="text-slate-300">{w.user?.name}</span> 
    },
    { 
      header: 'Hours', 
      cell: (w: WorkLog) => <span className="font-bold text-vividYellow">{w.hoursWorked}h</span> 
    },
    { 
      header: 'Description', 
      cell: (w: WorkLog) => <span className="text-slate-400 max-w-xs truncate block">{w.description}</span> 
    },
    { 
      header: 'Replies', 
      cell: (w: WorkLog) => <span className="text-slate-400">{w._count?.replies || 0}</span> 
    },
    { 
      header: 'Date', 
      cell: (w: WorkLog) => <span className="text-slate-400">{formatDateTime(w.createdAt)}</span> 
    },
  ];

  const handleRowClick = (worklog: WorkLog) => {
    // Navigate to task details with worklogs tab open
    navigate(`/tasks/${worklog.taskId}?tab=worklogs`);
  };

  return (
    <PageWrapper>
      <PageHeader 
        title="Work Logs" 
        description="View all logged hours and work updates across tasks."
      />

      <div className="mb-4 text-slate-300">
        Total hours logged in this view: <span className="font-bold text-vividYellow">{data?.meta?.totalHoursWorked || 0}h</span>
      </div>

      {data?.items.length === 0 && !isLoading ? (
        <EmptyState
          icon={Clock}
          title="No work logs found"
          description="Employees haven't logged any hours yet."
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
