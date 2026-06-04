import api from './axios';
import { Project, PaginatedResponse, ApiResponse } from '../types/api.types';

export const projectsApi = {
  getProjects: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Project>>>('/projects', { params });
    return data.data;
  },

  getProject: async (id: string) => {
    const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return data.data;
  },

  createProject: async (projectData: Partial<Project>) => {
    const { data } = await api.post<ApiResponse<Project>>('/projects', projectData);
    return data.data;
  },

  updateProject: async (id: string, projectData: Partial<Project>) => {
    const { data } = await api.put<ApiResponse<Project>>(`/projects/${id}`, projectData);
    return data.data;
  },

  deleteProject: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/projects/${id}`);
    return data.data;
  },
};
