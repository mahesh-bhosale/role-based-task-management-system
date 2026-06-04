import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worklogsApi } from '../api/worklogs.api';
import { useToast } from './use-toast';

export const useWorklogs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['worklogs', params],
    queryFn: () => worklogsApi.getWorkLogs(params),
  });
};

export const useTaskWorklogs = (taskId: string, params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['worklogs', 'task', taskId, params],
    queryFn: () => worklogsApi.getTaskWorkLogs(taskId, params),
    enabled: !!taskId,
  });
};

export const useWorklog = (id: string) => {
  return useQuery({
    queryKey: ['worklogs', id],
    queryFn: () => worklogsApi.getWorkLog(id),
    enabled: !!id,
  });
};

export const useCreateWorklog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: FormData }) => worklogsApi.createWorkLog(taskId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['worklogs'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      toast({ title: 'Work log submitted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit work log', description: error.message, variant: 'destructive' });
    }
  });
};

export const useAddReply = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ workLogId, message }: { workLogId: string; message: string }) => worklogsApi.addReply(workLogId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['worklogs', variables.workLogId] });
      toast({ title: 'Reply added successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add reply', description: error.message, variant: 'destructive' });
    }
  });
};
