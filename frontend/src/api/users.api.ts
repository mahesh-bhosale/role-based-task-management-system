import api from './axios';
import { User, PaginatedResponse, ApiResponse } from '../types/api.types';

export const usersApi = {
  getUsers: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return data.data;
  },

  getUser: async (id: string) => {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  createUser: async (userData: Partial<User>) => {
    const { data } = await api.post<ApiResponse<User>>('/users', userData);
    return data.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
    return data.data;
  },

  deactivateUser: async (id: string) => {
    const { data } = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return data.data;
  },
};
