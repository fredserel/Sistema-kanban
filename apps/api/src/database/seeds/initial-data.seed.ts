import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Project } from '../../modules/projects/entities/project.entity';
import { ProjectStage } from '../../modules/projects/entities/project-stage.entity';
import { ProjectMember } from '../../modules/projects/entities/project-member.entity';
import { Comment } from '../../modules/projects/entities/comment.entity';
import { AuditLog } from '../../modules/audit/entities/audit-log.entity';
import { Setting } from '../../modules/settings/entities/setting.entity';

// All system permissions
const PERMISSIONS = [
  // Usuários
  { slug: 'users.read', name: 'Visualizar', description: 'Permite visualizar usuários', resource: 'users', action: 'read' },
  { slug: 'users.create', name: 'Criar', description: 'Permite criar novos usuários', resource: 'users', action: 'create' },
  { slug: 'users.update', name: 'Editar', description: 'Permite editar usuários', resource: 'users', action: 'update' },
  { slug: 'users.delete', name: 'Excluir', description: 'Permite excluir usuários', resource: 'users', action: 'delete' },

  // Projetos
  { slug: 'projects.read', name: 'Visualizar', description: 'Permite visualizar projetos', resource: 'projects', action: 'read' },
  { slug: 'projects.create', name: 'Criar', description: 'Permite criar novos projetos', resource: 'projects', action: 'create' },
  { slug: 'projects.update', name: 'Editar', description: 'Permite editar projetos', resource: 'projects', action: 'update' },
  { slug: 'projects.delete', name: 'Excluir', description: 'Permite excluir projetos', resource: 'projects', action: 'delete' },

  // Etapas
  { slug: 'stages.read', name: 'Visualizar', description: 'Permite visualizar etapas', resource: 'stages', action: 'read' },
  { slug: 'stages.update', name: 'Editar', description: 'Permite editar etapas', resource: 'stages', action: 'update' },
  { slug: 'stages.complete', name: 'Concluir', description: 'Permite concluir etapas', resource: 'stages', action: 'complete' },
  { slug: 'stages.block', name: 'Bloquear', description: 'Permite bloquear e desbloquear etapas', resource: 'stages', action: 'block' },

  // Perfis
  { slug: 'roles.read', name: 'Visualizar', description: 'Permite visualizar perfis', resource: 'roles', action: 'read' },
  { slug: 'roles.manage', name: 'Gerenciar', description: 'Permite criar, editar e excluir perfis', resource: 'roles', action: 'manage' },

  // Lixeira
  { slug: 'trash.read', name: 'Visualizar', description: 'Permite visualizar itens na lixeira', resource: 'trash', action: 'read' },
  { slug: 'trash.restore', name: 'Restaurar', description: 'Permite restaurar itens da lixeira', resource: 'trash', action: 'restore' },
  { slug: 'trash.delete', name: 'Excluir', description: 'Permite excluir permanentemente da lixeira', resource: 'trash', action: 'delete' },

  // Relatórios
  { slug: 'reports.read', name: 'Visualizar', description: 'Permite visualizar relatórios', resource: 'reports', action: 'read' },
  { slug: 'reports.export', name: 'Exportar', description: 'Permite exportar relatórios', resource: 'reports', action: 'export' },

  // Kanban
  { slug: 'kanban.view', name: 'Visualizar', description: 'Permite visualizar o quadro kanban', resource: 'kanban', action: 'view' },

  // Configurações
  { slug: 'settings.read', name: 'Visualizar', description: 'Permite visualizar configurações', resource: 'settings', action: 'read' },
  { slug: 'settings.update', name: 'Editar', description: 'Permite editar configurações', resource: 'settings', action: 'update' },
];

// System roles with their permissions
const ROLES = [
  {
    slug: 'super-admin',
    name: 'Super Administrador',
    description: 'Acesso total ao sistema',
    isSystem: true,
    permissions: ['*'], // All permissions
  },
  {
    slug: 'admin',
    name: 'Administrador',
    description: 'Gerencia usuarios e projetos',
    isSystem: true,
    permissions: [
      'users.read', 'users.create', 'users.update',
      'projects.read', 'projects.create', 'projects.update', 'projects.delete',
      'stages.read', 'stages.update', 'stages.complete', 'stages.block',
      'kanban.view',
      'roles.read',
      'trash.read', 'trash.restore', 'trash.delete',
      'reports.read', 'reports.export',
    ],
  },
  {
    slug: 'manager',
    name: 'Gerente',
    description: 'Gerencia projetos atribuidos',
    isSystem: true,
    permissions: [
      'users.read',
      'projects.read', 'projects.create', 'projects.update',
      'stages.read', 'stages.update', 'stages.complete', 'stages.block',
      'kanban.view',
      'reports.read',
    ],
  },
  {
    slug: 'operator',
    name: 'Operador',
    description: 'Visualiza e comenta em projetos',
    isSystem: true,
    permissions: [
      'projects.read',
      'stages.read',
      'kanban.view',
    ],
  },
];

// Test users
const USERS = [
  {
    name: 'Administrador',
    email: 'admin@sistema.com',
    password: 'admin123',
    roles: ['super-admin'],
    isSuperAdmin: true,
  },
  {
    name: 'Gerente',
    email: 'gerente@sistema.com',
    password: 'gerente123',
    roles: ['manager'],
    isSuperAdmin: false,
  },
  {
    name: 'Membro',
    email: 'membro@sistema.com',
    password: 'membro123',
    roles: ['operator'],
    isSuperAdmin: false,
  },
];

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  console.log('Starting database seed...');

  const permissionRepo = dataSource.getRepository(Permission);
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // Create permissions
  console.log('Creating permissions...');
  const permissionEntities: Record<string, Permission> = {};

  for (const perm of PERMISSIONS) {
    let permission = await permissionRepo.findOne({ where: { slug: perm.slug } });

    if (!permission) {
      permission = permissionRepo.create(perm);
      await permissionRepo.save(permission);
    } else {
      // Update existing permission name/description
      Object.assign(permission, perm);
      await permissionRepo.save(permission);
    }

    permissionEntities[perm.slug] = permission;
  }
  console.log(`Created ${Object.keys(permissionEntities).length} permissions`);

  // Create roles
  console.log('Creating roles...');
  const roleEntities: Record<string, Role> = {};

  for (const roleData of ROLES) {
    let role = await roleRepo.findOne({
      where: { slug: roleData.slug },
      relations: ['permissions'],
    });

    if (!role) {
      role = roleRepo.create({
        slug: roleData.slug,
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
      });
    } else {
      role.name = roleData.name;
      role.description = roleData.description;
      role.isSystem = roleData.isSystem;
    }

    // Assign permissions
    if (roleData.permissions[0] === '*') {
      role.permissions = Object.values(permissionEntities);
    } else {
      role.permissions = roleData.permissions
        .map(slug => permissionEntities[slug])
        .filter(Boolean);
    }

    await roleRepo.save(role);
    roleEntities[roleData.slug] = role;
  }
  console.log(`Created ${Object.keys(roleEntities).length} roles`);

  // Create users
  console.log('Creating users...');
  let usersCreated = 0;

  for (const userData of USERS) {
    let user = await userRepo.findOne({ where: { email: userData.email } });

    if (!user) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      user = userRepo.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        isSuperAdmin: userData.isSuperAdmin,
        roles: userData.roles.map(slug => roleEntities[slug]).filter(Boolean),
      });

      await userRepo.save(user);
      usersCreated++;
    }
  }
  console.log(`Created ${usersCreated} users`);

  console.log('Database seed completed!');
}

export async function runSeed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'kanban',
    password: process.env.DB_PASSWORD || 'kanban123',
    database: process.env.DB_NAME || 'kanban_db',
    entities: [Permission, Role, User, Project, ProjectStage, ProjectMember, Comment, AuditLog, Setting],
    synchronize: true,
  });

  await dataSource.initialize();
  await seedDatabase(dataSource);
  await dataSource.destroy();
}

// Run if called directly
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
