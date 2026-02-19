import prisma from './prisma.service.js';
import { createAuditLog } from './audit.service.js';
import { StageName, Priority } from '../types/index.js';
import { hasPermission } from '../middlewares/auth.middleware.js';

const STAGE_ORDER: StageName[] = [
  'NAO_INICIADO',
  'MODELAGEM_NEGOCIO',
  'MODELAGEM_TI',
  'DESENVOLVIMENTO',
  'HOMOLOGACAO',
  'FINALIZADO',
];

export interface ProjectFilters {
  ownerId?: string;
  memberId?: string;
  priority?: Priority;
  currentStage?: StageName;
  search?: string;
  delayed?: boolean;
}

// Helper: verifica se o usuario e o owner do projeto ou tem permissao de update
export async function assertOwnerOrHasPermission(
  projectId: string,
  userId: string,
  userPermissions: string[]
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto nao encontrado');
  }

  const hasUpdatePermission = userPermissions.includes('projects.update');
  const isOwner = project.ownerId === userId;

  if (!hasUpdatePermission && !isOwner) {
    throw new Error('Acesso negado. Voce nao e o responsavel deste projeto.');
  }
  return project;
}

// Alias para compatibilidade com stage.service.ts
export async function assertOwnerOrAdmin(
  projectId: string,
  userId: string,
  userRoleOrPermissions: string | string[]
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto nao encontrado');
  }

  // Se for array, usar como permissoes
  if (Array.isArray(userRoleOrPermissions)) {
    const hasUpdatePermission = userRoleOrPermissions.includes('projects.update');
    const isOwner = project.ownerId === userId;
    if (!hasUpdatePermission && !isOwner) {
      throw new Error('Acesso negado. Voce nao e o responsavel deste projeto.');
    }
  } else {
    // Se for string (role antiga), verificar se e ADMIN ou owner
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRoleOrPermissions);
    const isOwner = project.ownerId === userId;
    if (!isAdmin && !isOwner) {
      throw new Error('Acesso negado. Voce nao e o responsavel deste projeto.');
    }
  }
  return project;
}

// Criacao de projeto pelo ADMIN
export async function createProject(
  input: {
    title: string;
    managerId: string;
    description?: string;
    priority?: Priority;
    stages?: Array<{
      stageName: StageName;
      plannedStartDate?: string;
      plannedEndDate?: string;
    }>;
  },
  adminUserId: string
) {
  const manager = await prisma.user.findUnique({
    where: { id: input.managerId },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });
  if (!manager) {
    throw new Error('Gerente não encontrado');
  }
  const managerRoles = manager.roles.map(ur => ur.role.name);
  const isManager = managerRoles.some(r => ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(r));
  if (!isManager) {
    throw new Error('Usuário selecionado não é um gerente');
  }

  // Preparar dados das etapas com datas planejadas se fornecidas
  const stagesData = STAGE_ORDER.map((stageName) => {
    const stageInput = input.stages?.find(s => s.stageName === stageName);
    return {
      stageName,
      plannedStartDate: stageInput?.plannedStartDate ? new Date(stageInput.plannedStartDate) : null,
      plannedEndDate: stageInput?.plannedEndDate ? new Date(stageInput.plannedEndDate) : null,
      status: stageName === 'NAO_INICIADO' ? 'IN_PROGRESS' as const : 'PENDING' as const,
    };
  });

  const project = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description || null,
      ownerId: input.managerId,
      currentStage: 'NAO_INICIADO',
      priority: input.priority || 'MEDIUM',
      stages: {
        create: stagesData,
      },
    },
    include: {
      stages: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: adminUserId,
    action: 'CREATE_PROJECT',
    entityType: 'PROJECT',
    entityId: project.id,
    newValue: { title: project.title, managerId: input.managerId },
  });

  return project;
}

export async function getProjects(filters: ProjectFilters = {}) {
  const where: any = { deletedAt: null };
  const andConditions: any[] = [];

  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  // Para MEMBER: mostra projetos onde e membro OU owner
  if (filters.memberId) {
    andConditions.push({
      OR: [
        { members: { some: { userId: filters.memberId } } },
        { ownerId: filters.memberId },
      ],
    });
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.currentStage) {
    where.currentStage = filters.currentStage;
  }

  if (filters.search) {
    andConditions.push({
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      stages: {
        orderBy: {
          stageName: 'asc',
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Filtrar por atraso se necessario
  if (filters.delayed) {
    const now = new Date();
    return projects.filter(project => {
      const currentStage = project.stages.find(s => s.stageName === project.currentStage);
      if (currentStage && currentStage.plannedEndDate && currentStage.plannedEndDate < now && currentStage.status !== 'COMPLETED') {
        return true;
      }
      return false;
    });
  }

  return projects;
}

export async function getProjectById(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      stages: {
        orderBy: {
          stageName: 'asc',
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  if (project.deletedAt) {
    throw new Error('Projeto não encontrado');
  }

  return project;
}

export async function updateProject(
  projectId: string,
  data: {
    title?: string;
    description?: string;
    priority?: Priority;
    stages?: Array<{
      stageName: StageName;
      plannedStartDate?: string;
      plannedEndDate?: string;
    }>;
  },
  userId: string,
  userPermissions: string[]
) {
  await assertOwnerOrHasPermission(projectId, userId, userPermissions);

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const oldValue = { title: project.title, description: project.description, priority: project.priority };

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
    include: {
      stages: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Atualizar datas das etapas se fornecidas
  if (data.stages && data.stages.length > 0) {
    for (const stageInput of data.stages) {
      const stageData: any = {};
      if (stageInput.plannedStartDate) stageData.plannedStartDate = new Date(stageInput.plannedStartDate);
      if (stageInput.plannedEndDate) stageData.plannedEndDate = new Date(stageInput.plannedEndDate);

      if (Object.keys(stageData).length > 0) {
        await prisma.projectStage.update({
          where: {
            projectId_stageName: {
              projectId,
              stageName: stageInput.stageName,
            },
          },
          data: stageData,
        });
      }
    }
  }

  await createAuditLog({
    userId,
    action: 'UPDATE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue,
    newValue: data,
  });

  // Retornar projeto atualizado com stages frescas
  return getProjectById(projectId);
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  if (project.deletedAt) {
    throw new Error('Projeto já está na lixeira');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: 'SOFT_DELETE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { title: project.title },
  });
}

export async function getDeletedProjects() {
  return prisma.project.findMany({
    where: {
      deletedAt: { not: null },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      deletedAt: 'desc',
    },
  });
}

export async function restoreProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  if (!project.deletedAt) {
    throw new Error('Projeto não está na lixeira');
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { deletedAt: null },
  });

  await createAuditLog({
    userId,
    action: 'RESTORE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    newValue: { title: project.title },
  });
}

export async function permanentDeleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  if (!project.deletedAt) {
    throw new Error('Projeto precisa estar na lixeira para exclusão permanente');
  }

  await createAuditLog({
    userId,
    action: 'PERMANENT_DELETE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { title: project.title },
  });

  await prisma.project.delete({ where: { id: projectId } });
}

export async function addProjectMember(
  projectId: string,
  memberId: string,
  addedById: string,
  addedByPermissions: string[]
) {
  await assertOwnerOrHasPermission(projectId, addedById, addedByPermissions);

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: memberId,
      },
    },
  });

  if (existingMember) {
    throw new Error('Usuário já é membro do projeto');
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: memberId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: addedById,
    action: 'ADD_MEMBER',
    entityType: 'PROJECT',
    entityId: projectId,
    newValue: { memberId },
  });

  return member;
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
  removedById: string,
  removedByPermissions: string[]
) {
  await assertOwnerOrHasPermission(projectId, removedById, removedByPermissions);

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: memberId,
      },
    },
  });

  if (!member) {
    throw new Error('Membro não encontrado no projeto');
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId: memberId,
      },
    },
  });

  await createAuditLog({
    userId: removedById,
    action: 'REMOVE_MEMBER',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { memberId },
  });
}

export async function addComment(projectId: string, userId: string, content: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isMember = project.members.some(m => m.userId === userId);
  const isOwner = project.ownerId === userId;
  const isAdmin = user?.role === 'ADMIN';

  if (!isMember && !isOwner && !isAdmin) {
    throw new Error('Você não tem acesso a este projeto');
  }

  return prisma.comment.create({
    data: {
      projectId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export function getStageOrder() {
  return STAGE_ORDER;
}

export async function changeProjectOwner(projectId: string, newOwnerId: string, changedById: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const newOwner = await prisma.user.findUnique({ where: { id: newOwnerId } });
  if (!newOwner) {
    throw new Error('Usuário não encontrado');
  }

  const oldOwnerId = project.ownerId;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { ownerId: newOwnerId },
    include: {
      stages: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  await createAuditLog({
    userId: changedById,
    action: 'CHANGE_OWNER',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { ownerId: oldOwnerId },
    newValue: { ownerId: newOwnerId },
  });

  return updated;
}
