import { apiClient } from './api/client';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  group: string;
  label: string;
  description: string;
  encrypted: boolean;
}

export const settingsService = {
  getAll: async (): Promise<Setting[]> => {
    const response = await apiClient.get<ApiResponse<Setting[]>>('/settings');
    return response.data.data;
  },

  update: async (settings: { key: string; value: string }[]): Promise<void> => {
    await apiClient.put('/settings', { settings });
  },
};

export default settingsService;
