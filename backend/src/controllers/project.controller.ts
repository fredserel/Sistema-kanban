import { Response } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  addComment,
} from '../services/project.service.js';
import { AuthenticatedRequest, Priority, StageName } from '../types/index.js';

export async function createProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { title, description, priority, stages } = req.body;

    if (!title || !stages || !Array.isArray(stages)) {
      return res.status(400).json({ error: 'Título e etapas são obrigatórios' });
    }

    const project = await createProject(
      { title, description, priority: priority || 'MEDIUM', stages },
      req.user.userId
    );

    res.status(201).json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar projeto';
    res.status(400).json({ error: message });
  }
}

export async function getProjectsController(req: AuthenticatedRequest, res: Response) {
  try {
    const { ownerId, memberId, priority, currentStage, search, delayed } = req.query;

    const projects = await getProjects({
      ownerId: ownerId as string,
      memberId: memberId as string,
      priority: priority as Priority,
      currentStage: currentStage as StageName,
      search: search as string,
      delayed: delayed === 'true',
    });

    res.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar projetos';
    res.status(400).json({ error: message });
  }
}

export async function getProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await getProjectById(id);
    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar projeto';
    res.status(404).json({ error: message });
  }
}

export async function updateProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { title, description, priority } = req.body;

    const project = await updateProject(id, { title, description, priority }, req.user.userId);
    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar projeto';
    res.status(400).json({ error: message });
  }
}

export async function deleteProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    await deleteProject(id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir projeto';
    res.status(400).json({ error: message });
  }
}

export async function addMemberController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    const member = await addProjectMember(id, userId, req.user.userId);
    res.status(201).json(member);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao adicionar membro';
    res.status(400).json({ error: message });
  }
}

export async function removeMemberController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id, userId } = req.params;
    await removeProjectMember(id, userId, req.user.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover membro';
    res.status(400).json({ error: message });
  }
}

export async function addCommentController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
    }

    const comment = await addComment(id, req.user.userId, content);
    res.status(201).json(comment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao adicionar comentário';
    res.status(400).json({ error: message });
  }
}
