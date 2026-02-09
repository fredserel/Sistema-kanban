import prisma from './prisma.service.js';
import { createAuditLog } from './audit.service.js';
import { assertOwnerOrAdmin } from './project.service.js';
import { StageName, StageStatus, Role } from '../types/index.js';

const STAGE_ORDER: StageName[] = [
  'NAO_INICIADO',
  'MODELAGEM_NEGOCIO',
  'MODELAGEM_TI',
  'DESENVOLVIMENTO',
  'HOMOLOGACAO',
  'FINALIZADO',
];

export async function getProjectStages(projectId: string) {
  const stages = await prisma.projectStage.findMany({
    where: { projectId },
    include: {
      blockedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      stageName: 'asc',
    },
  });

  return stages;
}

export async function updateStage(
  stageId: string,
  data: {
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
  },
  userId: string,
  userRole: Role
) {
  const stage = await prisma.projectStage.findUnique({
    where: { id: stageId },
  });

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  await assertOwnerOrAdmin(stage.projectId, userId, userRole);

  if (data.plannedStartDate && data.plannedEndDate) {
    if (new Date(data.plannedStartDate) > new Date(data.plannedEndDate)) {
      throw new Error('Data de início não pode ser maior que data de fim');
    }
  }

  const oldValue = {
    plannedStartDate: stage.plannedStartDate,
    plannedEndDate: stage.plannedEndDate,
    actualStartDate: stage.actualStartDate,
    actualEndDate: stage.actualEndDate,
  };

  const updated = await prisma.projectStage.update({
    where: { id: stageId },
    data: {
      ...(data.plannedStartDate && { plannedStartDate: new Date(data.plannedStartDate) }),
      ...(data.plannedEndDate && { plannedEndDate: new Date(data.plannedEndDate) }),
      ...(data.actualStartDate && { actualStartDate: new Date(data.actualStartDate) }),
      ...(data.actualEndDate && { actualEndDate: new Date(data.actualEndDate) }),
    },
  });

  await createAuditLog({
    userId,
    action: 'UPDATE_STAGE',
    entityType: 'STAGE',
    entityId: stageId,
    oldValue,
    newValue: data,
  });

  return updated;
}

export async function completeStage(stageId: string, userId: string, userRole: Role) {
  const stage = await prisma.projectStage.findUnique({
    where: { id: stageId },
    include: { project: true },
  });

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  await assertOwnerOrAdmin(stage.projectId, userId, userRole);

  if (stage.status === 'COMPLETED') {
    throw new Error('Etapa já está concluída');
  }

  if (stage.status === 'BLOCKED') {
    throw new Error('Etapa está bloqueada. Desbloqueie antes de concluir.');
  }

  // Verificar se etapa anterior esta completa
  const currentIndex = STAGE_ORDER.indexOf(stage.stageName);
  if (currentIndex > 0) {
    const previousStageName = STAGE_ORDER[currentIndex - 1];
    const previousStage = await prisma.projectStage.findUnique({
      where: {
        projectId_stageName: {
          projectId: stage.projectId,
          stageName: previousStageName,
        },
      },
    });

    if (previousStage && previousStage.status !== 'COMPLETED') {
      throw new Error(`Etapa anterior (${previousStageName}) deve ser concluída primeiro`);
    }
  }

  // Concluir etapa atual
  const updated = await prisma.projectStage.update({
    where: { id: stageId },
    data: {
      status: 'COMPLETED',
      actualEndDate: new Date(),
    },
  });

  // Avancar para proxima etapa se houver
  const nextIndex = currentIndex + 1;
  if (nextIndex < STAGE_ORDER.length) {
    const nextStageName = STAGE_ORDER[nextIndex];

    await prisma.projectStage.update({
      where: {
        projectId_stageName: {
          projectId: stage.projectId,
          stageName: nextStageName,
        },
      },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: new Date(),
      },
    });

    // Atualizar etapa atual do projeto
    await prisma.project.update({
      where: { id: stage.projectId },
      data: { currentStage: nextStageName },
    });
  }

  await createAuditLog({
    userId,
    action: 'COMPLETE_STAGE',
    entityType: 'STAGE',
    entityId: stageId,
    oldValue: { status: stage.status },
    newValue: { status: 'COMPLETED' },
  });

  return updated;
}

export async function blockStage(stageId: string, reason: string, userId: string, userRole: Role) {
  const stage = await prisma.projectStage.findUnique({
    where: { id: stageId },
  });

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  await assertOwnerOrAdmin(stage.projectId, userId, userRole);

  if (stage.status === 'COMPLETED') {
    throw new Error('Não é possível bloquear uma etapa já concluída');
  }

  if (stage.status === 'BLOCKED') {
    throw new Error('Etapa já está bloqueada');
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error('Motivo do bloqueio é obrigatório');
  }

  const updated = await prisma.projectStage.update({
    where: { id: stageId },
    data: {
      status: 'BLOCKED',
      blockReason: reason,
      blockedAt: new Date(),
      blockedById: userId,
    },
  });

  await createAuditLog({
    userId,
    action: 'BLOCK_STAGE',
    entityType: 'STAGE',
    entityId: stageId,
    newValue: { reason },
  });

  return updated;
}

export async function unblockStage(stageId: string, userId: string, userRole: Role) {
  const stage = await prisma.projectStage.findUnique({
    where: { id: stageId },
  });

  if (!stage) {
    throw new Error('Etapa não encontrada');
  }

  await assertOwnerOrAdmin(stage.projectId, userId, userRole);

  if (stage.status !== 'BLOCKED') {
    throw new Error('Etapa não está bloqueada');
  }

  const updated = await prisma.projectStage.update({
    where: { id: stageId },
    data: {
      status: 'IN_PROGRESS',
      blockReason: null,
      blockedAt: null,
      blockedById: null,
    },
  });

  await createAuditLog({
    userId,
    action: 'UNBLOCK_STAGE',
    entityType: 'STAGE',
    entityId: stageId,
    oldValue: { blockReason: stage.blockReason },
  });

  return updated;
}

export async function moveToStage(
  projectId: string,
  targetStageName: StageName,
  userId: string,
  userRole: Role,
  justification?: string
) {
  await assertOwnerOrAdmin(projectId, userId, userRole);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { stages: true },
  });

  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const currentIndex = STAGE_ORDER.indexOf(project.currentStage);
  const targetIndex = STAGE_ORDER.indexOf(targetStageName);

  // Verificar se e retorno (voltar para etapa anterior)
  if (targetIndex < currentIndex) {
    if (!justification || justification.trim().length === 0) {
      throw new Error('Justificativa é obrigatória para retornar a uma etapa anterior');
    }
  }

  // Verificar pulo de etapas (nao sequencial)
  if (targetIndex > currentIndex + 1) {
    if (userRole !== 'ADMIN') {
      throw new Error('Apenas administradores podem pular etapas');
    }
    if (!justification || justification.trim().length === 0) {
      throw new Error('Justificativa é obrigatória para pular etapas');
    }
  }

  // Verificar se todas as etapas anteriores estao completas (para avanco normal)
  if (targetIndex > currentIndex) {
    for (let i = 0; i < targetIndex; i++) {
      const stageName = STAGE_ORDER[i];
      const stage = project.stages.find(s => s.stageName === stageName);
      if (stage && stage.status !== 'COMPLETED' && userRole !== 'ADMIN') {
        throw new Error(`Etapa ${stageName} deve ser concluída antes de avançar`);
      }
    }
  }

  // Atualizar status das etapas
  const oldStage = project.stages.find(s => s.stageName === project.currentStage);

  if (targetIndex > currentIndex) {
    // Avancando - marcar etapa atual como completa
    if (oldStage && oldStage.status === 'IN_PROGRESS') {
      await prisma.projectStage.update({
        where: { id: oldStage.id },
        data: {
          status: 'COMPLETED',
          actualEndDate: new Date(),
        },
      });
    }
  } else if (targetIndex < currentIndex) {
    // Retornando - resetar etapas posteriores ao destino
    for (let i = targetIndex + 1; i <= currentIndex; i++) {
      const stageName = STAGE_ORDER[i];
      const stage = project.stages.find(s => s.stageName === stageName);
      if (stage) {
        await prisma.projectStage.update({
          where: { id: stage.id },
          data: {
            status: 'PENDING',
            actualStartDate: null,
            actualEndDate: null,
          },
        });
      }
    }
  }

  // Atualizar etapa de destino
  const targetStage = project.stages.find(s => s.stageName === targetStageName);
  if (targetStage) {
    await prisma.projectStage.update({
      where: { id: targetStage.id },
      data: {
        status: 'IN_PROGRESS',
        actualStartDate: targetIndex < currentIndex
          ? targetStage.actualStartDate
          : (targetStage.actualStartDate || new Date()),
        actualEndDate: null,
      },
    });
  }

  // Atualizar projeto
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { currentStage: targetStageName },
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
    userId,
    action: 'MOVE_STAGE',
    entityType: 'PROJECT',
    entityId: projectId,
    oldValue: { currentStage: project.currentStage },
    newValue: { currentStage: targetStageName, justification },
  });

  return updated;
}
