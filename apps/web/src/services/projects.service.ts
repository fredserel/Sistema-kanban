import { apiClient } from './api/client';

// API returns wrapped response: { success, data, timestamp }
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum StageName {
  NAO_INICIADO = 'NAO_INICIADO',
  MODELAGEM_NEGOCIO = 'MODELAGEM_NEGOCIO',
  MODELAGEM_TI = 'MODELAGEM_TI',
  DESENVOLVIMENTO = 'DESENVOLVIMENTO',
  HOMOLOGACAO = 'HOMOLOGACAO',
  FINALIZADO = 'FINALIZADO',
}

export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  stageName: StageName;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  blockedAt?: string;
  blockReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  currentStage: StageName;
  ownerId: string;
  owner: User;
  stages: ProjectStage[];
  members: ProjectMember[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateProjectDto {
  title: string;
  description?: string;
  priority?: Priority;
}

export interface UpdateProjectDto {
  title?: string;
  description?: string;
  priority?: Priority;
}

export interface ProjectFilters {
  ownerId?: string;
  priority?: Priority;
  currentStage?: StageName;
  search?: string;
}

export const projectsService = {
  getAll: async (filters?: ProjectFilters): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.currentStage) params.append('currentStage', filters.currentStage);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/projects?${queryString}` : '/projects';

    const response = await apiClient.get<ApiResponse<Project[]>>(url);
    return response.data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Trash operations
  getDeleted: async (): Promise<Project[]> => {
    const response = await apiClient.get<ApiResponse<Project[]>>('/projects/trash');
    return response.data.data;
  },

  restore: async (id: string): Promise<Project> => {
    const response = await apiClient.post<ApiResponse<Project>>(`/projects/${id}/restore`);
    return response.data.data;
  },

  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}/permanent`);
  },

  // Members
  addMember: async (projectId: string, userId: string): Promise<ProjectMember> => {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(`/projects/${projectId}/members`, { userId });
    return response.data.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  // Comments
  addComment: async (projectId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post<ApiResponse<Comment>>(`/projects/${projectId}/comments`, { content });
    return response.data.data;
  },
};

export default projectsService;
