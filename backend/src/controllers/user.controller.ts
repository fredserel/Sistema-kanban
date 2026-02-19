import { Response } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  removeRole,
} from '../services/user.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function getUsersController(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuarios';
    res.status(400).json({ error: message });
  }
}

export async function getUserController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await getUserById(id);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar usuario';
    res.status(404).json({ error: message });
  }
}

export async function createUserController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { email, password, name, roleId } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome sao obrigatorios' });
    }

    const user = await createUser({ email, password, name, roleId }, req.user.userId);
    res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar usuario';
    res.status(400).json({ error: message });
  }
}

export async function updateUserController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id } = req.params;
    const { name, email, password, active } = req.body;

    const user = await updateUser(id, { name, email, password, active }, req.user.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar usuario';
    res.status(400).json({ error: message });
  }
}

export async function deleteUserController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id } = req.params;
    await deleteUser(id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir usuario';
    res.status(400).json({ error: message });
  }
}

export async function assignRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ error: 'ID do perfil e obrigatorio' });
    }

    const user = await assignRole(id, roleId, req.user.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atribuir perfil';
    res.status(400).json({ error: message });
  }
}

export async function removeRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id, roleId } = req.params;
    const user = await removeRole(id, roleId, req.user.userId);
    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover perfil';
    res.status(400).json({ error: message });
  }
}
