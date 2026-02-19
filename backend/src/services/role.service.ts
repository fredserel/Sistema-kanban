import prisma from './prisma.service.js';
import { createAuditLog } from './audit.service.js';
import { permissionKey } from '../types/index.js';

export async function getAllRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return roles.map(role => ({
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    isSystem: role.isSystem,
    usersCount: role._count.users,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      key: permissionKey(rp.permission.resource, rp.permission.action),
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
    })),
  }));
}

export async function getRoleById(roleId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: {
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

  if (!role) {
    throw new Error('Perfil nao encontrado');
  }

  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      key: permissionKey(rp.permission.resource, rp.permission.action),
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
    })),
    users: role.users.map(ur => ur.user),
  };
}

export async function createRole(
  data: { name: string; displayName: string; description?: string; permissionIds?: string[] },
  creatorId: string
) {
  const existingRole = await prisma.role.findUnique({ where: { name: data.name } });
  if (existingRole) {
    throw new Error('Ja existe um perfil com este nome');
  }

  const role = await prisma.role.create({
    data: {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      isSystem: false,
    },
  });

  // Atribuir permissoes
  if (data.permissionIds && data.permissionIds.length > 0) {
    await prisma.rolePermission.createMany({
      data: data.permissionIds.map(permissionId => ({
        roleId: role.id,
        permissionId,
      })),
    });
  }

  await createAuditLog({
    userId: creatorId,
    action: 'CREATE_ROLE',
    entityType: 'ROLE',
    entityId: role.id,
    newValue: { name: role.name, displayName: role.displayName },
  });

  return getRoleById(role.id);
}

export async function updateRole(
  roleId: string,
  data: { displayName?: string; description?: string; permissionIds?: string[] },
  updaterId: string
) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error('Perfil nao encontrado');
  }

  const oldValue = { displayName: role.displayName, description: role.description };

  const updateData: any = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.description !== undefined) updateData.description = data.description;

  await prisma.role.update({
    where: { id: roleId },
    data: updateData,
  });

  // Atualizar permissoes se fornecidas
  if (data.permissionIds !== undefined) {
    // Remover permissoes antigas
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Adicionar novas permissoes
    if (data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        })),
      });
    }
  }

  await createAuditLog({
    userId: updaterId,
    action: 'UPDATE_ROLE',
    entityType: 'ROLE',
    entityId: roleId,
    oldValue,
    newValue: data,
  });

  return getRoleById(roleId);
}

export async function deleteRole(roleId: string, deleterId: string) {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    throw new Error('Perfil nao encontrado');
  }

  if (role.isSystem) {
    throw new Error('Perfis do sistema nao podem ser excluidos');
  }

  if (role._count.users > 0) {
    throw new Error('Nao e possivel excluir um perfil que possui usuarios');
  }

  await prisma.rolePermission.deleteMany({ where: { roleId } });
  await prisma.role.delete({ where: { id: roleId } });

  await createAuditLog({
    userId: deleterId,
    action: 'DELETE_ROLE',
    entityType: 'ROLE',
    entityId: roleId,
    oldValue: { name: role.name, displayName: role.displayName },
  });
}

export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { resource: 'asc' },
      { action: 'asc' },
    ],
  });

  return permissions.map(p => ({
    id: p.id,
    key: permissionKey(p.resource, p.action),
    resource: p.resource,
    action: p.action,
    description: p.description,
  }));
}

export async function getPermissionsGrouped() {
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { resource: 'asc' },
      { action: 'asc' },
    ],
  });

  const grouped: Record<string, Array<{
    id: string;
    key: string;
    action: string;
    description: string | null;
  }>> = {};

  for (const p of permissions) {
    if (!grouped[p.resource]) {
      grouped[p.resource] = [];
    }
    grouped[p.resource].push({
      id: p.id,
      key: permissionKey(p.resource, p.action),
      action: p.action,
      description: p.description,
    });
  }

  return grouped;
}
