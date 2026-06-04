import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export const useOverviewReport = () => {
  return useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: () => reportsApi.getOverviewReport(),
  });
};

export const useProjectReport = (projectId: string) => {
  return useQuery({
    queryKey: ['reports', 'project', projectId],
    queryFn: () => reportsApi.getProjectReport(projectId),
    enabled: !!projectId,
  });
};

export const useEmployeeReport = (userId: string) => {
  return useQuery({
    queryKey: ['reports', 'employee', userId],
    queryFn: () => reportsApi.getEmployeeReport(userId),
    enabled: !!userId,
  });
};
