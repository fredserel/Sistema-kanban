import api from './api';
import { Project, CreateProjectInput, Priority, StageName, User } from '../types';

export interface ProjectFilters {
  ownerId?: string;
  memberId?: string;
  priority?: Priority;
  currentStage?: StageName;
  search?: string;
  delayed?: boolean;
}

export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
  const params = new URLSearchParams();
  if (filters?.ownerId) params.append('ownerId', filters.ownerId);
  if (filters?.memberId) params.append('memberId', filters.memberId);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.currentStage) params.append('currentStage', filters.currentStage);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.delayed) params.append('delayed', 'true');

  const response = await api.get<Project[]>(`/projects?${params.toString()}`);
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const response = await api.post<Project>('/projects', data);
  return response.data;
}

export async function updateProject(
  id: string,
  data: { title?: string; description?: string; priority?: Priority }
): Promise<Project> {
  const response = await api.put<Project>(`/projects/${id}`, data);
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function addProjectMember(projectId: string, userId: string): Promise<void> {
  await api.post(`/projects/${projectId}/members`, { userId });
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function moveProject(
  projectId: string,
  targetStage: StageName,
  justification?: string
): Promise<Project> {
  const response = await api.post<Project>(`/projects/${projectId}/move`, {
    targetStage,
    justification,
  });
  return response.data;
}

export async function addComment(projectId: string, content: string): Promise<void> {
  await api.post(`/projects/${projectId}/comments`, { content });
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/users');
  return response.data;
}
