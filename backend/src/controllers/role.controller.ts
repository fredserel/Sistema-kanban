import { Response } from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  getPermissionsGrouped,
} from '../services/role.service.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function getRolesController(req: AuthenticatedRequest, res: Response) {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar perfis';
    res.status(400).json({ error: message });
  }
}

export async function getRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const role = await getRoleById(id);
    res.json(role);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar perfil';
    res.status(404).json({ error: message });
  }
}

export async function createRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { name, displayName, description, permissionIds } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Nome e nome de exibicao sao obrigatorios' });
    }

    const role = await createRole(
      { name, displayName, description, permissionIds },
      req.user.userId
    );
    res.status(201).json(role);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar perfil';
    res.status(400).json({ error: message });
  }
}

export async function updateRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id } = req.params;
    const { displayName, description, permissionIds } = req.body;

    const role = await updateRole(
      id,
      { displayName, description, permissionIds },
      req.user.userId
    );
    res.json(role);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    res.status(400).json({ error: message });
  }
}

export async function deleteRoleController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const { id } = req.params;
    await deleteRole(id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir perfil';
    res.status(400).json({ error: message });
  }
}

export async function getPermissionsController(req: AuthenticatedRequest, res: Response) {
  try {
    const permissions = await getAllPermissions();
    res.json(permissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar permissoes';
    res.status(400).json({ error: message });
  }
}

export async function getPermissionsGroupedController(req: AuthenticatedRequest, res: Response) {
  try {
    const permissions = await getPermissionsGrouped();
    res.json(permissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar permissoes';
    res.status(400).json({ error: message });
  }
}
