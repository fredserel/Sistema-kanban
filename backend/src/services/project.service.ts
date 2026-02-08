import prisma from './prisma.service.js';
import { createAuditLog } from './audit.service.js';
import { CreateProjectInput, StageName, Priority, StageStatus } from '../types/index.js';

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

export async function createProject(input: CreateProjectInput, ownerId: string) {
  // Validar que todas as 6 etapas foram informadas
  if (input.stages.length !== 6) {
    throw new Error('Todas as 6 etapas devem ser informadas');
  }

  // Validar ordem das etapas
  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const expectedStage = STAGE_ORDER[i];
    const providedStage = input.stages.find(s => s.stageName === expectedStage);
    if (!providedStage) {
      throw new Error(`Etapa ${expectedStage} não informada`);
    }
  }

  // Validar datas
  for (const stage of input.stages) {
    if (new Date(stage.plannedStartDate) > new Date(stage.plannedEndDate)) {
      throw new Error(`Data de início não pode ser maior que data de fim para a etapa ${stage.stageName}`);
    }
  }

  const project = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      ownerId,
      currentStage: 'NAO_INICIADO',
      stages: {
        create: input.stages.map(stage => ({
          stageName: stage.stageName,
          plannedStartDate: new Date(stage.plannedStartDate),
          plannedEndDate: new Date(stage.plannedEndDate),
          status: stage.stageName === 'NAO_INICIADO' ? 'IN_PROGRESS' : 'PENDING',
        })),
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
    userId: ownerId,
    action: 'CREATE_PROJECT',
    entityType: 'PROJECT',
    entityId: project.id,
    newValue: { title: project.title, priority: project.priority },
  });

  return project;
}

export async function getProjects(filters: ProjectFilters = {}) {
  const where: Parameters<typeof prisma.project.findMany>[0]['where'] = {};

  if (filters.ownerId) {
    where.ownerId = filters.ownerId;
  }

  if (filters.memberId) {
    where.members = {
      some: {
        userId: filters.memberId,
      },
    };
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.currentStage) {
    where.currentStage = filters.currentStage;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      stages: {
        orderBy: {
          plannedStartDate: 'asc',
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

  // Filtrar por atraso se necessário
  if (filters.delayed) {
    const now = new Date();
    return projects.filter(project => {
      const currentStage = project.stages.find(s => s.stageName === project.currentStage);
      if (currentStage && currentStage.plannedEndDate < now && currentStage.status !== 'COMPLETED') {
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
          plannedStartDate: 'asc',
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

  return project;
}

export async function updateProject(
  projectId: string,
  data: { title?: string; description?: string; priority?: Priority },
  userId: string
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const oldValue = { title: project.title, description: project.description, priority: project.priority };

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
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
    userId,
    action: 'UPDATE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue,
    newValue: data,
  });

  return updated;
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  await createAuditLog({
    userId,
    action: 'DELETE_PROJECT',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { title: project.title },
  });

  await prisma.project.delete({ where: { id: projectId } });
}

export async function addProjectMember(projectId: string, memberId: string, addedById: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

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

export async function removeProjectMember(projectId: string, memberId: string, removedById: string) {
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
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error('Projeto não encontrado');
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
