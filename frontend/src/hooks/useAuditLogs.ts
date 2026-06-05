import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api';

export const useAuditLogs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => auditApi.getAuditLogs(params),
  });
};
