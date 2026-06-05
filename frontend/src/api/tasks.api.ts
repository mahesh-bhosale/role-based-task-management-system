import api from './axios';
import { Task, PaginatedResponse, ApiResponse } from '../types/api.types';

export const tasksApi = {
  getTasks: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params });
    return data.data;
  },

  getTask: async (id: string) => {
    const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data.data;
  },

  createTask: async (taskData: Partial<Task>) => {
    const { data } = await api.post<ApiResponse<Task>>('/tasks', taskData);
    return data.data;
  },

  updateTask: async (id: string, taskData: Partial<Task>) => {
    const { data } = await api.put<ApiResponse<Task>>(`/tasks/${id}`, taskData);
    return data.data;
  },

  deleteTask: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/tasks/${id}`);
    return data.data;
  },

  assignTask: async (id: string, userId: string) => {
    const { data } = await api.patch<ApiResponse<null>>(`/tasks/${id}/assign`, { userId });
    return data.data;
  },

  unassignTask: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/tasks/${id}/assign`);
    return data.data;
  },
};
