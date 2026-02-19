import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './prisma.service.js';
import { LoginInput, RegisterInput, UserPayload, permissionKey } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Busca todas as permissoes de um usuario atraves de suas roles
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();

  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      const perm = rolePermission.permission;
      permissionSet.add(permissionKey(perm.resource, perm.action));
    }
  }

  return Array.from(permissionSet);
}

// Busca roles de um usuario
export async function getUserRoles(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    },
  });

  return userRoles.map(ur => ur.role);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Credenciais invalidas');
  }

  if (!user.active) {
    throw new Error('Usuario desativado');
  }

  const validPassword = await bcrypt.compare(input.password, user.password);
  if (!validPassword) {
    throw new Error('Credenciais invalidas');
  }

  const permissions = await getUserPermissions(user.id);
  const roles = await getUserRoles(user.id);

  const payload: UserPayload = {
    userId: user.id,
    email: user.email,
    permissions,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: roles,
      permissions,
    },
  };
}

export async function register(input: RegisterInput, creatorPermissions?: string[]) {
  // Verificar se o criador tem permissao para criar usuarios
  if (creatorPermissions && !creatorPermissions.includes('users.create')) {
    throw new Error('Permissao negada para criar usuarios');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new Error('Email ja cadastrado');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      name: input.name,
    },
  });

  // Atribuir role se fornecida
  if (input.roleId) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: input.roleId,
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

  const roles = await getUserRoles(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles,
  };
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

export function verifyToken(token: string): UserPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    throw new Error('Token invalido');
  }
}

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

  // Adicionar roles a cada usuario
  const usersWithRoles = await Promise.all(
    users.map(async (user) => ({
      ...user,
      roles: await getUserRoles(user.id),
    }))
  );

  return usersWithRoles;
}
