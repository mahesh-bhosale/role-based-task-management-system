import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../api/reports.api';

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard(),
  });
};
