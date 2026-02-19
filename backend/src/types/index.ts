import { Request } from 'express';
import { StageName, StageStatus, Priority } from '@prisma/client';

// Sistema de Permissoes
export interface UserPayload {
  userId: string;
  email: string;
  permissions: string[]; // formato: "resource.action"
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  priority: Priority;
  stages: StageInput[];
}

export interface StageInput {
  stageName: StageName;
  plannedStartDate: Date;
  plannedEndDate: Date;
}

export interface UpdateStageInput {
  actualStartDate?: Date;
  actualEndDate?: Date;
  status?: StageStatus;
}

export interface BlockStageInput {
  reason: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  roleId?: string;
}

// Recursos e Acoes disponiveis
export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PROJECTS: 'projects',
  STAGES: 'stages',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  TRASH: 'trash',
} as const;

export const ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  COMPLETE: 'complete',
  BLOCK: 'block',
  EXPORT: 'export',
  RESTORE: 'restore',
} as const;

// Helper para criar string de permissao
export function permissionKey(resource: string, action: string): string {
  return `${resource}.${action}`;
}

// Todas as permissoes do sistema
export const ALL_PERMISSIONS = [
  // Users
  { resource: RESOURCES.USERS, action: ACTIONS.READ, description: 'Visualizar usuarios' },
  { resource: RESOURCES.USERS, action: ACTIONS.CREATE, description: 'Criar usuarios' },
  { resource: RESOURCES.USERS, action: ACTIONS.UPDATE, description: 'Editar usuarios' },
  { resource: RESOURCES.USERS, action: ACTIONS.DELETE, description: 'Excluir usuarios' },

  // Roles
  { resource: RESOURCES.ROLES, action: ACTIONS.READ, description: 'Visualizar perfis' },
  { resource: RESOURCES.ROLES, action: ACTIONS.MANAGE, description: 'Gerenciar perfis e permissoes' },

  // Projects
  { resource: RESOURCES.PROJECTS, action: ACTIONS.READ, description: 'Visualizar projetos' },
  { resource: RESOURCES.PROJECTS, action: ACTIONS.CREATE, description: 'Criar projetos' },
  { resource: RESOURCES.PROJECTS, action: ACTIONS.UPDATE, description: 'Editar projetos' },
  { resource: RESOURCES.PROJECTS, action: ACTIONS.DELETE, description: 'Excluir projetos' },

  // Stages
  { resource: RESOURCES.STAGES, action: ACTIONS.READ, description: 'Visualizar etapas' },
  { resource: RESOURCES.STAGES, action: ACTIONS.UPDATE, description: 'Editar etapas' },
  { resource: RESOURCES.STAGES, action: ACTIONS.COMPLETE, description: 'Concluir etapas' },
  { resource: RESOURCES.STAGES, action: ACTIONS.BLOCK, description: 'Bloquear/desbloquear etapas' },

  // Trash
  { resource: RESOURCES.TRASH, action: ACTIONS.READ, description: 'Visualizar lixeira' },
  { resource: RESOURCES.TRASH, action: ACTIONS.RESTORE, description: 'Restaurar itens da lixeira' },
  { resource: RESOURCES.TRASH, action: ACTIONS.DELETE, description: 'Excluir permanentemente' },

  // Reports
  { resource: RESOURCES.REPORTS, action: ACTIONS.READ, description: 'Visualizar relatorios' },
  { resource: RESOURCES.REPORTS, action: ACTIONS.EXPORT, description: 'Exportar relatorios' },

  // Settings
  { resource: RESOURCES.SETTINGS, action: ACTIONS.READ, description: 'Visualizar configuracoes' },
  { resource: RESOURCES.SETTINGS, action: ACTIONS.UPDATE, description: 'Alterar configuracoes' },
] as const;

// Roles padrao do sistema
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrador',
    description: 'Acesso total ao sistema',
    isSystem: true,
    permissions: ALL_PERMISSIONS.map(p => permissionKey(p.resource, p.action)),
  },
  ADMIN: {
    name: 'ADMIN',
    displayName: 'Administrador',
    description: 'Gerencia usuarios e projetos',
    isSystem: true,
    permissions: [
      'users.read', 'users.create', 'users.update',
      'roles.read',
      'projects.read', 'projects.create', 'projects.update', 'projects.delete',
      'stages.read', 'stages.update', 'stages.complete', 'stages.block',
      'trash.read', 'trash.restore', 'trash.delete',
      'reports.read', 'reports.export',
    ],
  },
  MANAGER: {
    name: 'MANAGER',
    displayName: 'Gerente',
    description: 'Gerencia projetos atribuidos',
    isSystem: true,
    permissions: [
      'users.read',
      'projects.read', 'projects.create', 'projects.update',
      'stages.read', 'stages.update', 'stages.complete', 'stages.block',
      'reports.read',
    ],
  },
  OPERATOR: {
    name: 'OPERATOR',
    displayName: 'Operador',
    description: 'Visualiza e comenta em projetos',
    isSystem: true,
    permissions: [
      'projects.read',
      'stages.read',
    ],
  },
} as const;

export { StageName, StageStatus, Priority };
