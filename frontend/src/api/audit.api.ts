import api from './axios';
import { AuditLog, PaginatedResponse, ApiResponse } from '../types/api.types';

export const auditApi = {
  getAuditLogs: async (params?: Record<string, any>) => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit-logs', { params });
    return data.data;
  },
};
