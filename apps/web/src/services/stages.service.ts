import { apiClient } from './api/client';
import { ProjectStage, StageName } from './projects.service';

// API returns wrapped response: { success, data, timestamp }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface UpdateStageDto {
  plannedStartDate?: string;
  plannedEndDate?: string;
}

export interface MoveProjectDto {
  targetStage: StageName;
  justification?: string;
}

export const stagesService = {
  getByProject: async (projectId: string): Promise<ProjectStage[]> => {
    const response = await apiClient.get<ApiResponse<ProjectStage[]>>(`/projects/${projectId}/stages`);
    return response.data.data;
  },

  update: async (stageId: string, data: UpdateStageDto): Promise<ProjectStage> => {
    const response = await apiClient.put<ApiResponse<ProjectStage>>(`/stages/${stageId}`, data);
    return response.data.data;
  },

  complete: async (stageId: string): Promise<ProjectStage> => {
    const response = await apiClient.post<ApiResponse<ProjectStage>>(`/stages/${stageId}/complete`);
    return response.data.data;
  },

  block: async (stageId: string, reason: string): Promise<ProjectStage> => {
    const response = await apiClient.post<ApiResponse<ProjectStage>>(`/stages/${stageId}/block`, { reason });
    return response.data.data;
  },

  unblock: async (stageId: string): Promise<ProjectStage> => {
    const response = await apiClient.post<ApiResponse<ProjectStage>>(`/stages/${stageId}/unblock`);
    return response.data.data;
  },

  moveProject: async (projectId: string, data: MoveProjectDto): Promise<ProjectStage> => {
    const response = await apiClient.post<ApiResponse<ProjectStage>>(`/projects/${projectId}/move`, data);
    return response.data.data;
  },
};

export default stagesService;
