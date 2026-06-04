import React from 'react';
import { Badge } from '../ui/badge';
import { TASK_PRIORITY_LABELS } from '../../lib/constants';

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getVariant = () => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500 text-white hover:bg-red-600 border-red-700';
      case 'HIGH':
        return 'bg-orange-500 text-white hover:bg-orange-600 border-orange-700';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-700';
      case 'LOW':
      default:
        return 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-700';
    }
  };

  return (
    <Badge className={`font-semibold tracking-wide shadow-sm ${getVariant()}`}>
      {TASK_PRIORITY_LABELS[priority] || priority}
    </Badge>
  );
};
