import { Response } from 'express';
import {
  getProjectStages,
  updateStage,
  completeStage,
  blockStage,
  unblockStage,
  moveToStage,
} from '../services/stage.service.js';
import { AuthenticatedRequest, StageName } from '../types/index.js';

export async function getStagesController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const stages = await getProjectStages(id);
    res.json(stages);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar etapas';
    res.status(400).json({ error: message });
  }
}

export async function updateStageController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { plannedStartDate, plannedEndDate, actualStartDate, actualEndDate } = req.body;

    const stage = await updateStage(
      id,
      { plannedStartDate, plannedEndDate, actualStartDate, actualEndDate },
      req.user.userId,
      req.user.permissions
    );

    res.json(stage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar etapa';
    res.status(400).json({ error: message });
  }
}

export async function completeStageController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const stage = await completeStage(id, req.user.userId, req.user.permissions);
    res.json(stage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao concluir etapa';
    res.status(400).json({ error: message });
  }
}

export async function blockStageController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Motivo do bloqueio é obrigatório' });
    }

    const stage = await blockStage(id, reason, req.user.userId, req.user.permissions);
    res.json(stage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao bloquear etapa';
    res.status(400).json({ error: message });
  }
}

export async function unblockStageController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const stage = await unblockStage(id, req.user.userId, req.user.permissions);
    res.json(stage);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao desbloquear etapa';
    res.status(400).json({ error: message });
  }
}

export async function moveStageController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { targetStage, justification } = req.body;

    if (!targetStage) {
      return res.status(400).json({ error: 'Etapa de destino é obrigatória' });
    }

    const project = await moveToStage(
      id,
      targetStage as StageName,
      req.user.userId,
      req.user.permissions,
      justification
    );

    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao mover projeto';
    res.status(400).json({ error: message });
  }
}
