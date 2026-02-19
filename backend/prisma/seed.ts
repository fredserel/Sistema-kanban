import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ALL_PERMISSIONS, DEFAULT_ROLES, permissionKey } from '../src/types/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Criar todas as permissoes
  console.log('Criando permissoes...');
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        description: perm.description,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
  }
  console.log(`${ALL_PERMISSIONS.length} permissoes criadas/atualizadas`);

  // 2. Criar roles com suas permissoes
  console.log('Criando roles...');
  for (const roleData of Object.values(DEFAULT_ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem,
      },
    });

    // Remover permissoes antigas e adicionar novas
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    for (const permKey of roleData.permissions) {
      const [resource, action] = permKey.split('.');
      const permission = await prisma.permission.findUnique({
        where: {
          resource_action: { resource, action },
        },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log(`Role ${roleData.displayName} criada com ${roleData.permissions.length} permissoes`);
  }

  // 3. Criar usuarios de teste
  console.log('Criando usuarios...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Super Admin
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const managerRole = await prisma.role.findUnique({ where: { name: 'MANAGER' } });
  const operatorRole = await prisma.role.findUnique({ where: { name: 'OPERATOR' } });

  if (!superAdminRole || !adminRole || !managerRole || !operatorRole) {
    throw new Error('Roles nao encontradas');
  }

  // Usuario Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: hashedPassword,
      name: 'Super Administrador',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: superAdmin.id, roleId: superAdminRole.id },
  });
  console.log('Usuario SUPER_ADMIN criado:', superAdmin.email);

  // Usuario Gerente
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@sistema.com' },
    update: {},
    create: {
      email: 'gerente@sistema.com',
      password: await bcrypt.hash('gerente123', 10),
      name: 'Gerente de Projetos',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: manager.id, roleId: managerRole.id } },
    update: {},
    create: { userId: manager.id, roleId: managerRole.id },
  });
  console.log('Usuario MANAGER criado:', manager.email);

  // Usuario Operador
  const operator = await prisma.user.upsert({
    where: { email: 'membro@sistema.com' },
    update: {},
    create: {
      email: 'membro@sistema.com',
      password: await bcrypt.hash('membro123', 10),
      name: 'Operador',
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: operator.id, roleId: operatorRole.id } },
    update: {},
    create: { userId: operator.id, roleId: operatorRole.id },
  });
  console.log('Usuario OPERATOR criado:', operator.email);

  console.log('Seed concluido com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
