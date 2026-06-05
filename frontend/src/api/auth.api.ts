import api from './axios';
import { User, ApiResponse } from '../types/api.types';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials) => {
    const { data } = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', credentials);
    return data;
  },

  logout: async (refreshToken: string) => {
    const { data } = await api.post<ApiResponse<null>>('/auth/logout', { refreshToken });
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, password: string) => {
    const { data } = await api.post<ApiResponse<null>>('/auth/reset-password', { token, password });
    return data;
  },
};
