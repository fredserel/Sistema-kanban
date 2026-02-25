import { apiClient } from './api/client';

// API returns wrapped response: { success, data, timestamp }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface Permission {
  id: string;
  slug: string;
  name: string;
  description: string;
  resource: string;
}

export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
  userCount: number;
}

export interface CreateRoleDto {
  slug: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
}

export interface GroupedPermissions {
  [resource: string]: Permission[];
}

export const rolesService = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get<ApiResponse<Role[]>>('/roles');
    return response.data.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
    return response.data.data;
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>('/roles', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await apiClient.put<ApiResponse<Role>>(`/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/roles/${id}`);
  },
};

export const permissionsService = {
  getAll: async (): Promise<Permission[]> => {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/permissions');
    return response.data.data;
  },

  getGrouped: async (): Promise<GroupedPermissions> => {
    const response = await apiClient.get<ApiResponse<GroupedPermissions>>('/permissions/grouped');
    return response.data.data;
  },
};

export default rolesService;
