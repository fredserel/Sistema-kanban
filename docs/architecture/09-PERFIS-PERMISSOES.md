# Sistema de Perfis e Permissões (RBAC)

## 1. Visão Geral

O sistema implementa **RBAC (Role-Based Access Control)** com suporte a permissões
granulares, permitindo controle fino sobre as ações que cada perfil pode executar.

### 1.1 Modelo Conceitual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SISTEMA DE CONTROLE DE ACESSO                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐         ┌──────────┐         ┌──────────────┐           │
│   │  USERS   │────────▶│  ROLES   │────────▶│ PERMISSIONS  │           │
│   │          │   N:N   │ (Perfis) │   N:N   │              │           │
│   └──────────┘         └──────────┘         └──────────────┘           │
│                                                                         │
│   Exemplos:            Exemplos:            Exemplos:                   │
│   • João Silva         • Admin              • users.create              │
│   • Maria Santos       • Gerente            • users.read                │
│   • Pedro Costa        • Vendedor           • users.update              │
│                        • Financeiro         • users.delete              │
│                        • Operador           • products.create           │
│                                             • orders.approve            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Características

| Característica | Descrição |
|----------------|-----------|
| **Multi-role** | Usuário pode ter múltiplos perfis |
| **Granular** | Permissões por recurso e ação |
| **Hierárquico** | Perfis podem herdar de outros |
| **Dinâmico** | Perfis e permissões configuráveis em runtime |
| **Auditável** | Log de alterações de acesso |

---

## 2. Modelagem de Dados

### 2.1 Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │   user_roles    │       │     roles       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id          PK  │──┐    │ user_id     FK  │    ┌──│ id          PK  │
│ name            │  └───▶│ role_id     FK  │◀───┘  │ name            │
│ email           │       │ assigned_at     │       │ slug            │
│ password        │       │ assigned_by     │       │ description     │
│ is_active       │       └─────────────────┘       │ is_active       │
│ created_at      │                                 │ parent_id   FK  │──┐
│ updated_at      │                                 │ created_at      │  │
└─────────────────┘                                 └─────────────────┘  │
                                                           ▲             │
                                                           └─────────────┘
                                                           (hierarquia)

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     roles       │       │role_permissions │       │  permissions    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id          PK  │──┐    │ role_id     FK  │    ┌──│ id          PK  │
│ ...             │  └───▶│ permission_id FK│◀───┘  │ name            │
└─────────────────┘       │ granted_at      │       │ slug            │
                          │ granted_by      │       │ description     │
                          └─────────────────┘       │ resource        │
                                                    │ action          │
                                                    │ created_at      │
                                                    └─────────────────┘
```

### 2.2 Estrutura das Tabelas

```sql
-- ============================================
-- TABELA: permissions (Permissões)
-- ============================================
CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    resource VARCHAR(50) NOT NULL,      -- Ex: 'users', 'products', 'orders'
    action VARCHAR(50) NOT NULL,        -- Ex: 'create', 'read', 'update', 'delete'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_resource_action (resource, action),
    INDEX idx_resource (resource),
    INDEX idx_slug (slug)
);

-- ============================================
-- TABELA: roles (Perfis)
-- ============================================
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,    -- Perfis do sistema (não editáveis)
    parent_id VARCHAR(36),              -- Herança de perfil
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    FOREIGN KEY (parent_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active)
);

-- ============================================
-- TABELA: role_permissions (Perfil-Permissões)
-- ============================================
CREATE TABLE role_permissions (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(36),             -- Usuário que concedeu

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_role_permission (role_id, permission_id)
);

-- ============================================
-- TABELA: user_roles (Usuário-Perfis)
-- ============================================
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(36),            -- Usuário que atribuiu
    expires_at DATETIME,                -- Expiração opcional

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_role (user_id, role_id)
);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Permissões efetivas do usuário
CREATE VIEW vw_user_permissions AS
SELECT DISTINCT
    u.id AS user_id,
    u.email,
    p.id AS permission_id,
    p.slug AS permission_slug,
    p.resource,
    p.action,
    r.name AS role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.is_active = TRUE
  AND r.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
```

### 2.3 Dados Iniciais (Seeds)

```sql
-- ============================================
-- PERMISSIONS PADRÃO
-- ============================================
INSERT INTO permissions (id, name, slug, resource, action, description) VALUES
-- Usuários
(UUID(), 'Visualizar Usuários', 'users.read', 'users', 'read', 'Permite visualizar lista e detalhes de usuários'),
(UUID(), 'Criar Usuários', 'users.create', 'users', 'create', 'Permite criar novos usuários'),
(UUID(), 'Editar Usuários', 'users.update', 'users', 'update', 'Permite editar dados de usuários'),
(UUID(), 'Excluir Usuários', 'users.delete', 'users', 'delete', 'Permite excluir usuários'),

-- Perfis
(UUID(), 'Visualizar Perfis', 'roles.read', 'roles', 'read', 'Permite visualizar perfis de acesso'),
(UUID(), 'Gerenciar Perfis', 'roles.manage', 'roles', 'manage', 'Permite criar, editar e excluir perfis'),

-- Produtos
(UUID(), 'Visualizar Produtos', 'products.read', 'products', 'read', 'Permite visualizar produtos'),
(UUID(), 'Criar Produtos', 'products.create', 'products', 'create', 'Permite criar produtos'),
(UUID(), 'Editar Produtos', 'products.update', 'products', 'update', 'Permite editar produtos'),
(UUID(), 'Excluir Produtos', 'products.delete', 'products', 'delete', 'Permite excluir produtos'),

-- Pedidos
(UUID(), 'Visualizar Pedidos', 'orders.read', 'orders', 'read', 'Permite visualizar pedidos'),
(UUID(), 'Criar Pedidos', 'orders.create', 'orders', 'create', 'Permite criar pedidos'),
(UUID(), 'Aprovar Pedidos', 'orders.approve', 'orders', 'approve', 'Permite aprovar pedidos'),
(UUID(), 'Cancelar Pedidos', 'orders.cancel', 'orders', 'cancel', 'Permite cancelar pedidos'),

-- Relatórios
(UUID(), 'Visualizar Relatórios', 'reports.read', 'reports', 'read', 'Permite visualizar relatórios'),
(UUID(), 'Exportar Relatórios', 'reports.export', 'reports', 'export', 'Permite exportar relatórios'),

-- Configurações
(UUID(), 'Visualizar Configurações', 'settings.read', 'settings', 'read', 'Permite visualizar configurações'),
(UUID(), 'Editar Configurações', 'settings.update', 'settings', 'update', 'Permite editar configurações');

-- ============================================
-- ROLES PADRÃO
-- ============================================
INSERT INTO roles (id, name, slug, description, is_system) VALUES
(UUID(), 'Super Admin', 'super-admin', 'Acesso total ao sistema', TRUE),
(UUID(), 'Administrador', 'admin', 'Administração geral do sistema', TRUE),
(UUID(), 'Gerente', 'manager', 'Gerenciamento de operações', FALSE),
(UUID(), 'Vendedor', 'salesperson', 'Operações de vendas', FALSE),
(UUID(), 'Financeiro', 'financial', 'Operações financeiras', FALSE),
(UUID(), 'Operador', 'operator', 'Operações básicas', FALSE),
(UUID(), 'Visualizador', 'viewer', 'Apenas visualização', FALSE);
```

---

## 3. Entidades TypeORM

### 3.1 Permission Entity

```typescript
// modules/permissions/entities/permission.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50 })
  @Index()
  resource: string;

  @Column({ length: 50 })
  action: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // RELACIONAMENTOS
  // ============================================

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
```

### 3.2 Role Entity

```typescript
// modules/roles/entities/role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // Perfis do sistema não podem ser editados

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // ============================================
  // RELACIONAMENTOS
  // ============================================

  // Hierarquia de perfis
  @ManyToOne(() => Role, (role) => role.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Role;

  @OneToMany(() => Role, (role) => role.parent)
  children: Role[];

  // Permissões do perfil
  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  // Usuários com este perfil
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  /**
   * Verifica se o perfil tem uma permissão específica
   */
  hasPermission(permissionSlug: string): boolean {
    return this.permissions?.some((p) => p.slug === permissionSlug) ?? false;
  }

  /**
   * Retorna todas as permissões (incluindo herdadas)
   */
  getAllPermissions(): Permission[] {
    const permissions = [...(this.permissions || [])];

    if (this.parent) {
      permissions.push(...this.parent.getAllPermissions());
    }

    // Remove duplicatas
    return [...new Map(permissions.map((p) => [p.id, p])).values()];
  }
}
```

### 3.3 User Entity (Atualizada)

```typescript
// modules/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_super_admin', default: false })
  isSuperAdmin: boolean; // Bypass de todas as permissões

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // ============================================
  // RELACIONAMENTOS
  // ============================================

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  // ============================================
  // MÉTODOS DE PERMISSÃO
  // ============================================

  /**
   * Retorna todas as permissões do usuário (de todos os perfis)
   */
  getPermissions(): Permission[] {
    if (!this.roles) return [];

    const allPermissions: Permission[] = [];

    for (const role of this.roles) {
      if (role.isActive) {
        allPermissions.push(...role.getAllPermissions());
      }
    }

    // Remove duplicatas
    return [...new Map(allPermissions.map((p) => [p.id, p])).values()];
  }

  /**
   * Retorna slugs das permissões para uso em guards
   */
  getPermissionSlugs(): string[] {
    return this.getPermissions().map((p) => p.slug);
  }

  /**
   * Verifica se usuário tem uma permissão específica
   */
  hasPermission(permissionSlug: string): boolean {
    if (this.isSuperAdmin) return true;
    return this.getPermissionSlugs().includes(permissionSlug);
  }

  /**
   * Verifica se usuário tem TODAS as permissões especificadas
   */
  hasAllPermissions(permissionSlugs: string[]): boolean {
    if (this.isSuperAdmin) return true;
    const userPermissions = this.getPermissionSlugs();
    return permissionSlugs.every((slug) => userPermissions.includes(slug));
  }

  /**
   * Verifica se usuário tem ALGUMA das permissões especificadas
   */
  hasAnyPermission(permissionSlugs: string[]): boolean {
    if (this.isSuperAdmin) return true;
    const userPermissions = this.getPermissionSlugs();
    return permissionSlugs.some((slug) => userPermissions.includes(slug));
  }

  /**
   * Verifica se usuário tem um perfil específico
   */
  hasRole(roleSlug: string): boolean {
    return this.roles?.some((r) => r.slug === roleSlug && r.isActive) ?? false;
  }
}
```

### 3.4 UserRole Entity (Tabela Pivô com Metadados)

```typescript
// modules/users/entities/user-role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt: Date;

  // ============================================
  // RELACIONAMENTOS
  // ============================================

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User;

  // ============================================
  // MÉTODOS
  // ============================================

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}
```

---

## 4. Guards e Decorators

### 4.1 Permissions Decorator

```typescript
// modules/auth/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator para definir permissões necessárias para acessar uma rota
 *
 * @example
 * // Requer UMA das permissões
 * @Permissions('users.read', 'users.manage')
 *
 * @example
 * // Requer TODAS as permissões (use RequireAllPermissions)
 * @RequireAllPermissions('orders.read', 'orders.approve')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, requireAll: false });

export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, requireAll: true });
```

### 4.2 Permissions Guard

```typescript
// modules/auth/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface PermissionsMetadata {
  permissions: string[];
  requireAll: boolean;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Busca metadata de permissões
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há permissões definidas, permite acesso
    if (!metadata || !metadata.permissions.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Super admin tem acesso total
    if (user.isSuperAdmin) {
      return true;
    }

    const { permissions, requireAll } = metadata;

    // Verifica permissões
    const hasPermission = requireAll
      ? user.hasAllPermissions(permissions)
      : user.hasAnyPermission(permissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissão negada. Requer: ${permissions.join(requireAll ? ' E ' : ' OU ')}`,
      );
    }

    return true;
  }
}
```

### 4.3 Combined Auth Guard

```typescript
// modules/auth/guards/auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard combinado que verifica:
 * 1. Se a rota é pública
 * 2. Se o JWT é válido
 *
 * Use em conjunto com PermissionsGuard para verificar permissões
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### 4.4 Uso nos Controllers

```typescript
// modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { Permissions, RequireAllPermissions } from '@/modules/auth/decorators/permissions.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Aplica guards globalmente no controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // Requer permissão 'users.read'
  // ============================================
  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Listar usuários' })
  findAll() {
    return this.usersService.findAll();
  }

  // ============================================
  // Requer permissão 'users.read'
  // ============================================
  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ============================================
  // Requer permissão 'users.create'
  // ============================================
  @Post()
  @Permissions('users.create')
  @ApiOperation({ summary: 'Criar usuário' })
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: User) {
    return this.usersService.create(dto, currentUser.id);
  }

  // ============================================
  // Requer permissão 'users.update'
  // ============================================
  @Put(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ============================================
  // Requer permissão 'users.delete'
  // ============================================
  @Delete(':id')
  @Permissions('users.delete')
  @ApiOperation({ summary: 'Excluir usuário' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ============================================
  // Requer TODAS as permissões (roles.read E roles.manage)
  // ============================================
  @Put(':id/roles')
  @RequireAllPermissions('users.update', 'roles.manage')
  @ApiOperation({ summary: 'Atribuir perfis ao usuário' })
  assignRoles(
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.usersService.assignRoles(id, dto.roleIds, currentUser.id);
  }
}
```

---

## 5. Services

### 5.1 Roles Service

```typescript
// modules/roles/roles.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // ============================================
  // CRUD
  // ============================================

  async findAll() {
    return this.roleRepository.find({
      relations: ['permissions', 'parent'],
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'parent', 'children'],
    });

    if (!role) {
      throw new NotFoundException(`Perfil #${id} não encontrado`);
    }

    return role;
  }

  async findBySlug(slug: string) {
    return this.roleRepository.findOne({
      where: { slug },
      relations: ['permissions'],
    });
  }

  async create(dto: CreateRoleDto, createdBy: string) {
    // Verifica se slug já existe
    const existing = await this.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Perfil com slug '${dto.slug}' já existe`);
    }

    // Busca permissões
    let permissions: Permission[] = [];
    if (dto.permissionIds?.length) {
      permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
    }

    // Cria perfil
    const role = this.roleRepository.create({
      ...dto,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // Verifica se é perfil do sistema
    if (role.isSystem) {
      throw new BadRequestException('Perfis do sistema não podem ser editados');
    }

    // Atualiza permissões se fornecidas
    if (dto.permissionIds !== undefined) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
    }

    // Atualiza outros campos
    Object.assign(role, dto);

    return this.roleRepository.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('Perfis do sistema não podem ser excluídos');
    }

    await this.roleRepository.softDelete(id);
  }

  // ============================================
  // PERMISSÕES
  // ============================================

  async addPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);

    if (role.isSystem) {
      throw new BadRequestException('Perfis do sistema não podem ser editados');
    }

    const newPermissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    // Adiciona novas permissões (sem duplicar)
    const existingIds = role.permissions.map((p) => p.id);
    const toAdd = newPermissions.filter((p) => !existingIds.includes(p.id));

    role.permissions.push(...toAdd);

    return this.roleRepository.save(role);
  }

  async removePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);

    if (role.isSystem) {
      throw new BadRequestException('Perfis do sistema não podem ser editados');
    }

    role.permissions = role.permissions.filter(
      (p) => !permissionIds.includes(p.id),
    );

    return this.roleRepository.save(role);
  }

  // ============================================
  // HIERARQUIA
  // ============================================

  async setParent(roleId: string, parentId: string | null) {
    const role = await this.findOne(roleId);

    if (parentId) {
      // Verifica ciclos
      const parent = await this.findOne(parentId);
      if (await this.wouldCreateCycle(roleId, parentId)) {
        throw new BadRequestException('Esta operação criaria um ciclo na hierarquia');
      }
      role.parent = parent;
    } else {
      role.parent = null;
    }

    return this.roleRepository.save(role);
  }

  private async wouldCreateCycle(roleId: string, newParentId: string): Promise<boolean> {
    let currentId = newParentId;

    while (currentId) {
      if (currentId === roleId) {
        return true;
      }
      const current = await this.roleRepository.findOne({
        where: { id: currentId },
        relations: ['parent'],
      });
      currentId = current?.parentId;
    }

    return false;
  }
}
```

### 5.2 Permissions Service

```typescript
// modules/permissions/permissions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findByResource(resource: string) {
    return this.permissionRepository.find({
      where: { resource },
      order: { action: 'ASC' },
    });
  }

  async findOne(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permissão #${id} não encontrada`);
    }

    return permission;
  }

  /**
   * Retorna permissões agrupadas por recurso
   */
  async findAllGrouped(): Promise<Record<string, Permission[]>> {
    const permissions = await this.findAll();

    return permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  /**
   * Lista todos os recursos únicos
   */
  async getResources(): Promise<string[]> {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.resource', 'resource')
      .orderBy('resource', 'ASC')
      .getRawMany();

    return result.map((r) => r.resource);
  }
}
```

### 5.3 Users Service (Atualizado)

```typescript
// modules/users/users.service.ts (métodos adicionais)

@Injectable()
export class UsersService {
  // ... outros métodos

  /**
   * Atribui perfis a um usuário
   */
  async assignRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // Busca perfis
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds), isActive: true },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('Um ou mais perfis não foram encontrados');
    }

    // Atualiza perfis
    user.roles = roles;

    const updated = await this.userRepository.save(user);

    // Log de auditoria
    this.logger.log(`Perfis atualizados para usuário ${userId} por ${assignedBy}`);

    return updated;
  }

  /**
   * Adiciona perfis a um usuário (sem remover existentes)
   */
  async addRoles(userId: string, roleIds: string[], assignedBy: string): Promise<User> {
    const user = await this.findOne(userId);

    const newRoles = await this.roleRepository.find({
      where: { id: In(roleIds), isActive: true },
    });

    // Adiciona apenas perfis que o usuário ainda não tem
    const existingIds = user.roles.map((r) => r.id);
    const toAdd = newRoles.filter((r) => !existingIds.includes(r.id));

    user.roles.push(...toAdd);

    return this.userRepository.save(user);
  }

  /**
   * Remove perfis de um usuário
   */
  async removeRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.findOne(userId);

    user.roles = user.roles.filter((r) => !roleIds.includes(r.id));

    return this.userRepository.save(user);
  }

  /**
   * Retorna permissões efetivas do usuário
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions', 'roles.parent', 'roles.parent.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`Usuário #${userId} não encontrado`);
    }

    return user.getPermissions();
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  async checkPermission(userId: string, permissionSlug: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return false;

    return user.hasPermission(permissionSlug);
  }
}
```

---

## 6. DTOs

### 6.1 Role DTOs

```typescript
// modules/roles/dto/create-role.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Gerente de Vendas' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'gerente-vendas' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Responsável pela equipe de vendas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds?: string[];

  @ApiPropertyOptional({ example: 'uuid-parent' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
```

```typescript
// modules/roles/dto/update-role.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['slug'] as const), // Slug não pode ser alterado
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

```typescript
// modules/roles/dto/role-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class PermissionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  resource: string;

  @ApiProperty()
  action: string;
}

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ type: [PermissionResponse] })
  permissions: PermissionResponse[];

  @ApiProperty()
  createdAt: Date;
}
```

### 6.2 User Role DTOs

```typescript
// modules/users/dto/assign-roles.dto.ts
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({
    example: ['uuid-role-1', 'uuid-role-2'],
    description: 'IDs dos perfis a serem atribuídos (substitui perfis existentes)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  roleIds: string[];
}
```

---

## 7. JWT Payload Atualizado

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    // Busca usuário com roles e permissions
    const user = await this.usersService.findOneWithPermissions(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    // Retorna usuário com métodos de permissão disponíveis
    return {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.roles.map((r) => r.slug),
      permissions: user.getPermissionSlugs(),
      // Métodos
      hasPermission: (slug: string) => user.hasPermission(slug),
      hasAnyPermission: (slugs: string[]) => user.hasAnyPermission(slugs),
      hasAllPermissions: (slugs: string[]) => user.hasAllPermissions(slugs),
      hasRole: (slug: string) => user.hasRole(slug),
    };
  }
}
```

---

## 8. Próximo Documento

→ [Frontend - Gerenciamento de Perfis](./10-FRONTEND-PERFIS.md)

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição              |
|------------|--------|--------------|------------------------|
| 2026-02-11 | 1.0.0  | Arquiteto    | Versão inicial         |
