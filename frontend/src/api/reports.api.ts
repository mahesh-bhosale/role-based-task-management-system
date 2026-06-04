import api from './axios';
import { DashboardData, OverviewReport, ProjectReport, EmployeeReport, ApiResponse } from '../types/api.types';

export const reportsApi = {
  getDashboard: async () => {
    const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard');
    return data.data;
  },

  getOverviewReport: async () => {
    const { data } = await api.get<ApiResponse<OverviewReport>>('/reports/overview');
    return data.data;
  },

  getProjectReport: async (projectId: string) => {
    const { data } = await api.get<ApiResponse<ProjectReport>>(`/reports/project/${projectId}`);
    return data.data;
  },

  getEmployeeReport: async (userId: string) => {
    const { data } = await api.get<ApiResponse<EmployeeReport>>(`/reports/employee/${userId}`);
    return data.data;
  },
};
