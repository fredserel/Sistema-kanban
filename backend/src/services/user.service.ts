import prisma from './prisma.service.js';
import bcrypt from 'bcrypt';
import { getUserRoles, getUserPermissions } from './auth.service.js';
import { createAuditLog } from './audit.service.js';

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const usersWithRoles = await Promise.all(
    users.map(async (user) => ({
      ...user,
      roles: await getUserRoles(user.id),
    }))
  );

  return usersWithRoles;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      active: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('Usuario nao encontrado');
  }

  const roles = await getUserRoles(userId);
  const permissions = await getUserPermissions(userId);

  return {
    ...user,
    roles,
    permissions,
  };
}

export async function createUser(
  data: { email: string; password: string; name: string; roleId?: string },
  creatorId: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('Email ja cadastrado');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });

  // Atribuir role se fornecida
  if (data.roleId) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: data.roleId,
      },
    });
  } else {
    // Atribuir role OPERATOR por padrao
    const operatorRole = await prisma.role.findUnique({ where: { name: 'OPERATOR' } });
    if (operatorRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: operatorRole.id,
        },
      });
    }
  }

  await createAuditLog({
    userId: creatorId,
    action: 'CREATE_USER',
    entityType: 'USER',
    entityId: user.id,
    newValue: { email: user.email, name: user.name },
  });

  return getUserById(user.id);
}

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string; password?: string; active?: boolean },
  updaterId: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Usuario nao encontrado');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const oldValue = { name: user.name, email: user.email, active: user.active };

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await createAuditLog({
    userId: updaterId,
    action: 'UPDATE_USER',
    entityType: 'USER',
    entityId: userId,
    oldValue,
    newValue: data,
  });

  return getUserById(userId);
}

export async function deleteUser(userId: string, deleterId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Usuario nao encontrado');
  }

  // Desativar em vez de excluir (soft delete)
  await prisma.user.update({
    where: { id: userId },
    data: { active: false },
  });

  await createAuditLog({
    userId: deleterId,
    action: 'DELETE_USER',
    entityType: 'USER',
    entityId: userId,
    oldValue: { email: user.email, name: user.name },
  });
}

export async function assignRole(userId: string, roleId: string, assignerId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Usuario nao encontrado');
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new Error('Perfil nao encontrado');
  }

  // Verificar se ja tem a role
  const existingUserRole = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });

  if (existingUserRole) {
    throw new Error('Usuario ja possui este perfil');
  }

  await prisma.userRole.create({
    data: { userId, roleId },
  });

  await createAuditLog({
    userId: assignerId,
    action: 'ASSIGN_ROLE',
    entityType: 'USER',
    entityId: userId,
    newValue: { roleId, roleName: role.name },
  });

  return getUserById(userId);
}

export async function removeRole(userId: string, roleId: string, removerId: string) {
  const userRole = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId } },
    include: { role: true },
  });

  if (!userRole) {
    throw new Error('Usuario nao possui este perfil');
  }

  // Verificar se e a unica role do usuario
  const userRolesCount = await prisma.userRole.count({ where: { userId } });
  if (userRolesCount <= 1) {
    throw new Error('Usuario deve ter pelo menos um perfil');
  }

  await prisma.userRole.delete({
    where: { userId_roleId: { userId, roleId } },
  });

  await createAuditLog({
    userId: removerId,
    action: 'REMOVE_ROLE',
    entityType: 'USER',
    entityId: userId,
    oldValue: { roleId, roleName: userRole.role.name },
  });

  return getUserById(userId);
}
