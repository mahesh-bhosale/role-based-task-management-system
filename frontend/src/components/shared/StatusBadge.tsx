import React from 'react';
import { Badge } from '../ui/badge';
import { PROJECT_STATUS_LABELS, TASK_STATUS_LABELS } from '../../lib/constants';

interface StatusBadgeProps {
  status: string;
  type?: 'project' | 'task';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'task' }) => {
  const getVariant = () => {
    switch (status) {
      case 'COMPLETED':
      case 'ARCHIVED':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'IN_REVIEW':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'BLOCKED':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'TODO':
      case 'PLANNING':
      default:
        return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
    }
  };

  const label = type === 'project' 
    ? PROJECT_STATUS_LABELS[status] || status 
    : TASK_STATUS_LABELS[status] || status;

  return (
    <Badge variant="outline" className={`border-transparent ${getVariant()}`}>
      {label}
    </Badge>
  );
};
