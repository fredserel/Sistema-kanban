// ===========================================
// ENUMS
// ===========================================

export enum UserRole {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
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

// ===========================================
// USER TYPES
// ===========================================

export interface User {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  avatarUrl?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles?: Role[];
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
}

// ===========================================
// PROJECT TYPES
// ===========================================

export interface Project {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  currentStage: StageName;
  ownerId: string;
  owner?: User;
  stages?: ProjectStage[];
  members?: ProjectMember[];
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  stageName: StageName;
  status: StageStatus;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  blockReason?: string;
  blockedAt?: Date;
  blockedById?: string;
  blockedBy?: User;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  assignedAt: Date;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: Date;
}

// ===========================================
// AUDIT TYPES
// ===========================================

export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: Date;
}

// ===========================================
// API TYPES
// ===========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    statusCode: number;
    message: string;
    details?: unknown;
    path: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ===========================================
// AUTH TYPES
// ===========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

// ===========================================
// CONSTANTS
// ===========================================

export const STAGE_ORDER: StageName[] = [
  StageName.NAO_INICIADO,
  StageName.MODELAGEM_NEGOCIO,
  StageName.MODELAGEM_TI,
  StageName.DESENVOLVIMENTO,
  StageName.HOMOLOGACAO,
  StageName.FINALIZADO,
];

export const STAGE_LABELS: Record<StageName, string> = {
  [StageName.NAO_INICIADO]: 'Não Iniciado',
  [StageName.MODELAGEM_NEGOCIO]: 'Modelagem de Negócio',
  [StageName.MODELAGEM_TI]: 'Modelagem de TI',
  [StageName.DESENVOLVIMENTO]: 'Desenvolvimento',
  [StageName.HOMOLOGACAO]: 'Homologação',
  [StageName.FINALIZADO]: 'Finalizado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Baixa',
  [Priority.MEDIUM]: 'Média',
  [Priority.HIGH]: 'Alta',
  [Priority.CRITICAL]: 'Crítica',
};

export const STATUS_LABELS: Record<StageStatus, string> = {
  [StageStatus.PENDING]: 'Pendente',
  [StageStatus.IN_PROGRESS]: 'Em Progresso',
  [StageStatus.COMPLETED]: 'Concluído',
  [StageStatus.BLOCKED]: 'Bloqueado',
};
