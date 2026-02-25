import { apiClient } from './api/client';
import { User } from '@/stores/auth.store';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  roleIds?: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// API returns wrapped response: { success, data, timestamp }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};

export default authService;
