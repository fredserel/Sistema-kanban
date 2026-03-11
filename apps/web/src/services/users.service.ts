import { apiClient } from './api/client';

// API returns wrapped response: { success, data, timestamp }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  avatarUrl: string | null;
  phone: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  roles: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  roleIds?: string[];
  phone?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  phone?: string;
  roleIds?: string[];
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const usersService = {
  getAll: async (params?: UsersParams): Promise<UsersResponse> => {
    const response = await apiClient.get<ApiResponse<UsersResponse>>('/users', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const { roleIds, ...userData } = data;
    const response = await apiClient.post<ApiResponse<User>>('/users', userData);
    const user = response.data.data;

    // Assign roles separately if provided
    if (roleIds && roleIds.length > 0) {
      const rolesResponse = await apiClient.put<ApiResponse<User>>(`/users/${user.id}/roles`, { roleIds });
      return rolesResponse.data.data;
    }

    return user;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const { roleIds, ...userData } = data;
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);

    // Update roles separately if provided
    if (roleIds) {
      const rolesResponse = await apiClient.put<ApiResponse<User>>(`/users/${id}/roles`, { roleIds });
      return rolesResponse.data.data;
    }

    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  updateRoles: async (id: string, roleIds: string[]): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}/roles`, { roleIds });
    return response.data.data;
  },

  getDeleted: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/users/trash');
    return response.data.data;
  },

  restore: async (id: string): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(`/users/${id}/restore`);
    return response.data.data;
  },

  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}/permanent`);
  },
};

export default usersService;
