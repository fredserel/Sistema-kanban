import api from './api';
import { ProjectStage } from '../types';

export async function updateStage(
  stageId: string,
  data: {
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  }
): Promise<ProjectStage> {
  const response = await api.put<ProjectStage>(`/stages/${stageId}`, data);
  return response.data;
}

export async function completeStage(stageId: string): Promise<ProjectStage> {
  const response = await api.post<ProjectStage>(`/stages/${stageId}/complete`);
  return response.data;
}

export async function blockStage(stageId: string, reason: string): Promise<ProjectStage> {
  const response = await api.post<ProjectStage>(`/stages/${stageId}/block`, { reason });
  return response.data;
}

export async function unblockStage(stageId: string): Promise<ProjectStage> {
  const response = await api.post<ProjectStage>(`/stages/${stageId}/unblock`);
  return response.data;
}
