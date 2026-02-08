export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StageName =
  | 'NAO_INICIADO'
  | 'MODELAGEM_NEGOCIO'
  | 'MODELAGEM_TI'
  | 'DESENVOLVIMENTO'
  | 'HOMOLOGACAO'
  | 'FINALIZADO';
export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  stageName: StageName;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: StageStatus;
  blockReason?: string;
  blockedAt?: string;
  blockedBy?: {
    id: string;
    name: string;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  ownerId: string;
  currentStage: StageName;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  stages: ProjectStage[];
  members: ProjectMember[];
  comments?: Comment[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  priority: Priority;
  stages: {
    stageName: StageName;
    plannedStartDate: string;
    plannedEndDate: string;
  }[];
}

export const STAGE_LABELS: Record<StageName, string> = {
  NAO_INICIADO: 'Nao Iniciado',
  MODELAGEM_NEGOCIO: 'Modelagem de Negocio',
  MODELAGEM_TI: 'Modelagem de TI',
  DESENVOLVIMENTO: 'Desenvolvimento',
  HOMOLOGACAO: 'Homologacao',
  FINALIZADO: 'Finalizado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<StageStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export const STAGE_ORDER: StageName[] = [
  'NAO_INICIADO',
  'MODELAGEM_NEGOCIO',
  'MODELAGEM_TI',
  'DESENVOLVIMENTO',
  'HOMOLOGACAO',
  'FINALIZADO',
];
