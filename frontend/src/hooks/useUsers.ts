import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import { User } from '../types/api.types';

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

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => usersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
