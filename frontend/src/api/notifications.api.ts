import api from './axios';
import { Notification, PaginatedResponse, ApiResponse } from '../types/api.types';

export const notificationsApi = {
  getNotifications: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params });
    return data.data;
  },

  markAsRead: async (id: string) => {
    const { data } = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return data.data;
  },

  markAllAsRead: async () => {
    const { data } = await api.put<ApiResponse<null>>('/notifications/read-all');
    return data.data;
  },
};
