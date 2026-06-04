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
};
