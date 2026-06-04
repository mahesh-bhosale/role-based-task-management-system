import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';

export const useUsers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
};
