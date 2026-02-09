import { Response } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  permanentDeleteProject,
  addProjectMember,
  removeProjectMember,
  addComment,
  changeProjectOwner,
} from '../services/project.service.js';
import { AuthenticatedRequest, Priority, StageName } from '../types/index.js';

export async function createProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { title, managerId } = req.body;

    if (!title || !managerId) {
      return res.status(400).json({ error: 'Título e gerente são obrigatórios' });
    }

    const project = await createProject({ title, managerId }, req.user.userId);
    res.status(201).json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar projeto';
    res.status(400).json({ error: message });
  }
}

export async function getProjectsController(req: AuthenticatedRequest, res: Response) {
  try {
    const { ownerId, memberId, priority, currentStage, search, delayed } = req.query;

    // MEMBER so ve projetos onde e membro
    let effectiveMemberId = memberId as string;
    if (req.user?.role === 'MEMBER') {
      effectiveMemberId = req.user.userId;
    }

    const projects = await getProjects({
      ownerId: ownerId as string,
      memberId: effectiveMemberId,
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
    const { title, description, priority, stages } = req.body;

    const project = await updateProject(
      id,
      { title, description, priority, stages },
      req.user.userId,
      req.user.role
    );
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

    const member = await addProjectMember(id, userId, req.user.userId, req.user.role);
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
    await removeProjectMember(id, userId, req.user.userId, req.user.role);
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
    const message = error instanceof Error ? error.message : 'Erro ao adicionar comentario';
    res.status(400).json({ error: message });
  }
}

export async function changeOwnerController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    const { ownerId } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'ID do novo responsável é obrigatório' });
    }

    const project = await changeProjectOwner(id, ownerId, req.user.userId);
    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar responsável';
    res.status(400).json({ error: message });
  }
}

export async function getDeletedProjectsController(req: AuthenticatedRequest, res: Response) {
  try {
    const projects = await getDeletedProjects();
    res.json(projects);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar projetos excluídos';
    res.status(400).json({ error: message });
  }
}

export async function restoreProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    await restoreProject(id, req.user.userId);
    res.json({ message: 'Projeto restaurado com sucesso' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao restaurar projeto';
    res.status(400).json({ error: message });
  }
}

export async function permanentDeleteProjectController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { id } = req.params;
    await permanentDeleteProject(id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir projeto permanentemente';
    res.status(400).json({ error: message });
  }
}
