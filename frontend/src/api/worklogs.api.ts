import api from './axios';
import { WorkLog, LogReply, PaginatedResponse, ApiResponse } from '../types/api.types';

export const worklogsApi = {
  getWorkLogs: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<WorkLog>>>('/worklogs', { params });
    return data.data;
  },

  getTaskWorkLogs: async (taskId: string, params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<WorkLog>>>(`/tasks/${taskId}/worklogs`, { params });
    return data.data;
  },

  getWorkLog: async (id: string) => {
    const { data } = await api.get<ApiResponse<WorkLog>>(`/worklogs/${id}`);
    return data.data;
  },

  createWorkLog: async (taskId: string, formData: FormData) => {
    const { data } = await api.post<ApiResponse<WorkLog>>(`/tasks/${taskId}/worklogs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  addReply: async (workLogId: string, message: string) => {
    const { data } = await api.post<ApiResponse<LogReply>>(`/worklogs/${workLogId}/replies`, { message });
    return data.data;
  },
};
