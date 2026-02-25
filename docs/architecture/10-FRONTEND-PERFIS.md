# Frontend - Gerenciamento de Perfis e Permissões

## 1. Visão Geral

Este documento descreve a implementação do sistema de gerenciamento de perfis e
permissões no frontend Next.js, incluindo componentes, hooks, stores e páginas.

### 1.1 Funcionalidades

- Listagem de perfis com permissões
- Criação e edição de perfis
- Atribuição de permissões a perfis
- Atribuição de perfis a usuários
- Controle de acesso em componentes
- Proteção de rotas baseada em permissões

---

## 2. Estrutura de Arquivos

```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── roles/
│           │   ├── page.tsx              # Lista de perfis
│           │   ├── new/
│           │   │   └── page.tsx          # Criar perfil
│           │   └── [id]/
│           │       └── page.tsx          # Editar perfil
│           └── permissions/
│               └── page.tsx              # Lista de permissões
│
├── components/
│   └── features/
│       └── roles/
│           ├── RoleList/
│           ├── RoleForm/
│           ├── RoleCard/
│           ├── PermissionSelector/
│           ├── UserRoleAssignment/
│           └── index.ts
│
├── hooks/
│   ├── useAuth.ts                        # Hook de autenticação
│   ├── usePermissions.ts                 # Hook de verificação de permissões
│   └── queries/
│       ├── useRoles.ts                   # Queries de perfis
│       └── usePermissions.ts             # Queries de permissões
│
├── services/
│   ├── roles.service.ts
│   └── permissions.service.ts
│
├── stores/
│   └── auth.store.ts                     # Store com permissões do usuário
│
├── types/
│   └── auth.types.ts                     # Tipos de auth/permissions
│
└── lib/
    └── permissions.ts                    # Utilitários de permissões
```

---

## 2. Types

```typescript
// types/auth.types.ts

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: Permission[];
  parent?: Role;
  children?: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  roles: Role[];
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  roles: string[];           // Slugs dos perfis
  permissions: string[];     // Slugs das permissões
}

// DTOs
export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permissionIds?: string[];
  parentId?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
  parentId?: string;
  isActive?: boolean;
}

export interface AssignRolesDto {
  roleIds: string[];
}
```

---

## 3. Auth Store (Atualizado)

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { AuthUser } from '@/types';

interface AuthState {
  // Estado
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Ações
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Verificações de permissão
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,

        // Ações
        setUser: (user) =>
          set({
            user,
            isAuthenticated: !!user,
          }),

        setToken: (token) => set({ token }),

        login: (user, token) =>
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          }),

        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          }),

        setLoading: (isLoading) => set({ isLoading }),

        // ============================================
        // VERIFICAÇÕES DE PERMISSÃO
        // ============================================

        hasPermission: (permission: string) => {
          const { user } = get();
          if (!user) return false;
          if (user.isSuperAdmin) return true;
          return user.permissions.includes(permission);
        },

        hasAnyPermission: (permissions: string[]) => {
          const { user } = get();
          if (!user) return false;
          if (user.isSuperAdmin) return true;
          return permissions.some((p) => user.permissions.includes(p));
        },

        hasAllPermissions: (permissions: string[]) => {
          const { user } = get();
          if (!user) return false;
          if (user.isSuperAdmin) return true;
          return permissions.every((p) => user.permissions.includes(p));
        },

        hasRole: (role: string) => {
          const { user } = get();
          if (!user) return false;
          return user.roles.includes(role);
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          token: state.token,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// ============================================
// SELETORES
// ============================================
export const selectUser = (state: AuthState) => state.user;
export const selectPermissions = (state: AuthState) => state.user?.permissions ?? [];
export const selectRoles = (state: AuthState) => state.user?.roles ?? [];
export const selectIsSuperAdmin = (state: AuthState) => state.user?.isSuperAdmin ?? false;
```

---

## 4. Hook de Permissões

```typescript
// hooks/usePermissions.ts
'use client';

import { useAuthStore } from '@/stores';

/**
 * Hook para verificação de permissões
 *
 * @example
 * const { can, canAny, canAll, isAdmin } = usePermissions();
 *
 * if (can('users.create')) { ... }
 * if (canAny(['users.read', 'users.manage'])) { ... }
 */
export function usePermissions() {
  const {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  } = useAuthStore();

  return {
    // Usuário atual
    user,

    // Verifica uma permissão
    can: hasPermission,

    // Verifica se tem ALGUMA das permissões
    canAny: hasAnyPermission,

    // Verifica se tem TODAS as permissões
    canAll: hasAllPermissions,

    // Verifica se tem um perfil
    hasRole,

    // Atalhos comuns
    isAdmin: hasRole('admin') || hasRole('super-admin'),
    isSuperAdmin: user?.isSuperAdmin ?? false,

    // Lista de permissões do usuário
    permissions: user?.permissions ?? [],
    roles: user?.roles ?? [],
  };
}

// ============================================
// TIPO PARA CONSTANTES DE PERMISSÕES
// ============================================
export const PERMISSIONS = {
  // Usuários
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Perfis
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',

  // Produtos
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',

  // Pedidos
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_APPROVE: 'orders.approve',
  ORDERS_CANCEL: 'orders.cancel',

  // Relatórios
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',

  // Configurações
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
```

---

## 5. Componentes de Controle de Acesso

### 5.1 Componente Can (Condicional)

```typescript
// components/auth/Can.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions, PermissionSlug } from '@/hooks/usePermissions';

interface CanProps {
  /** Permissão necessária (ou array para verificar se tem ALGUMA) */
  permission: PermissionSlug | PermissionSlug[];

  /** Se true, requer TODAS as permissões do array */
  requireAll?: boolean;

  /** Conteúdo a ser renderizado se tiver permissão */
  children: ReactNode;

  /** Conteúdo alternativo se não tiver permissão */
  fallback?: ReactNode;
}

/**
 * Renderiza children apenas se usuário tiver permissão
 *
 * @example
 * // Uma permissão
 * <Can permission="users.create">
 *   <Button>Criar Usuário</Button>
 * </Can>
 *
 * @example
 * // Alguma das permissões
 * <Can permission={['users.update', 'users.manage']}>
 *   <Button>Editar</Button>
 * </Can>
 *
 * @example
 * // Todas as permissões
 * <Can permission={['orders.read', 'orders.approve']} requireAll>
 *   <Button>Aprovar Pedido</Button>
 * </Can>
 *
 * @example
 * // Com fallback
 * <Can permission="reports.export" fallback={<span>Sem permissão</span>}>
 *   <Button>Exportar</Button>
 * </Can>
 */
export function Can({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission = requireAll
    ? canAll(permissions)
    : permissions.length === 1
      ? can(permissions[0])
      : canAny(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 5.2 Componente CanNot (Inverso)

```typescript
// components/auth/CanNot.tsx
'use client';

import { ReactNode } from 'react';
import { usePermissions, PermissionSlug } from '@/hooks/usePermissions';

interface CanNotProps {
  permission: PermissionSlug | PermissionSlug[];
  children: ReactNode;
}

/**
 * Renderiza children apenas se usuário NÃO tiver permissão
 *
 * @example
 * <CanNot permission="users.delete">
 *   <Alert>Você não pode excluir usuários</Alert>
 * </CanNot>
 */
export function CanNot({ permission, children }: CanNotProps) {
  const { can, canAny } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasPermission =
    permissions.length === 1 ? can(permissions[0]) : canAny(permissions);

  if (hasPermission) {
    return null;
  }

  return <>{children}</>;
}
```

### 5.3 Proteção de Rota (Middleware)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Mapeamento de rotas para permissões necessárias
const routePermissions: Record<string, string[]> = {
  '/settings/roles': ['roles.read'],
  '/settings/roles/new': ['roles.manage'],
  '/settings/roles/[id]': ['roles.manage'],
  '/users': ['users.read'],
  '/users/new': ['users.create'],
  '/products': ['products.read'],
  '/orders': ['orders.read'],
  '/reports': ['reports.read'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verifica token
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decodifica JWT para verificar permissões
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const userPermissions = (payload.permissions as string[]) || [];
    const isSuperAdmin = payload.isSuperAdmin as boolean;

    // Verifica permissão para a rota
    for (const [route, requiredPermissions] of Object.entries(routePermissions)) {
      const routePattern = route.replace(/\[.*?\]/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);

      if (regex.test(pathname)) {
        const hasPermission =
          isSuperAdmin ||
          requiredPermissions.some((p) => userPermissions.includes(p));

        if (!hasPermission) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        break;
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|api).*)'],
};
```

---

## 6. React Query Hooks

### 6.1 useRoles

```typescript
// hooks/queries/useRoles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesService } from '@/services';
import { Role, CreateRoleDto, UpdateRoleDto } from '@/types';

// ============================================
// QUERY KEYS
// ============================================
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters?: object) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

// ============================================
// QUERIES
// ============================================

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: () => rolesService.getAll(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesService.getById(id),
    enabled: !!id,
  });
}

// ============================================
// MUTATIONS
// ============================================

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleDto) => rolesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleDto }) =>
      rolesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => rolesService.updatePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
    },
  });
}
```

### 6.2 usePermissions (Queries)

```typescript
// hooks/queries/usePermissionsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { permissionsService } from '@/services';

export const permissionKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionKeys.all, 'list'] as const,
  grouped: () => [...permissionKeys.all, 'grouped'] as const,
  resources: () => [...permissionKeys.all, 'resources'] as const,
};

export function usePermissionsList() {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: () => permissionsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos (permissões raramente mudam)
  });
}

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: permissionKeys.grouped(),
    queryFn: () => permissionsService.getAllGrouped(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePermissionResources() {
  return useQuery({
    queryKey: permissionKeys.resources(),
    queryFn: () => permissionsService.getResources(),
    staleTime: 10 * 60 * 1000,
  });
}
```

---

## 7. Componentes de UI

### 7.1 PermissionSelector

```typescript
// components/features/roles/PermissionSelector/PermissionSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { usePermissionsGrouped } from '@/hooks/queries/usePermissionsQuery';
import { Permission } from '@/types';
import { cn } from '@/lib/utils';

interface PermissionSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  selectedIds,
  onChange,
  disabled = false,
}: PermissionSelectorProps) {
  const { data: groupedPermissions, isLoading } = usePermissionsGrouped();
  const [search, setSearch] = useState('');
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  // Filtra permissões por busca
  const filteredGroups = useMemo(() => {
    if (!groupedPermissions) return {};
    if (!search) return groupedPermissions;

    const searchLower = search.toLowerCase();
    const filtered: Record<string, Permission[]> = {};

    for (const [resource, permissions] of Object.entries(groupedPermissions)) {
      const matching = permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower)
      );

      if (matching.length > 0) {
        filtered[resource] = matching;
      }
    }

    return filtered;
  }, [groupedPermissions, search]);

  const toggleResource = (resource: string) => {
    setExpandedResources((prev) =>
      prev.includes(resource)
        ? prev.filter((r) => r !== resource)
        : [...prev, resource]
    );
  };

  const togglePermission = (permissionId: string) => {
    if (disabled) return;

    const newIds = selectedIds.includes(permissionId)
      ? selectedIds.filter((id) => id !== permissionId)
      : [...selectedIds, permissionId];

    onChange(newIds);
  };

  const toggleAllInResource = (permissions: Permission[]) => {
    if (disabled) return;

    const permissionIds = permissions.map((p) => p.id);
    const allSelected = permissionIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // Remove todas
      onChange(selectedIds.filter((id) => !permissionIds.includes(id)));
    } else {
      // Adiciona todas
      const newIds = [...new Set([...selectedIds, ...permissionIds])];
      onChange(newIds);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded" />;
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <Input
        type="search"
        placeholder="Buscar permissões..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Lista de recursos/permissões */}
      <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
        {Object.entries(filteredGroups).map(([resource, permissions]) => {
          const isExpanded = expandedResources.includes(resource) || !!search;
          const selectedCount = permissions.filter((p) =>
            selectedIds.includes(p.id)
          ).length;
          const allSelected = selectedCount === permissions.length;
          const someSelected = selectedCount > 0 && !allSelected;

          return (
            <div key={resource}>
              {/* Cabeçalho do recurso */}
              <div
                className={cn(
                  'flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => toggleResource(resource)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => toggleAllInResource(permissions)}
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="font-medium capitalize">{resource}</span>
                  <span className="text-sm text-gray-500">
                    ({selectedCount}/{permissions.length})
                  </span>
                </div>
                <span className="text-gray-400">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </div>

              {/* Lista de permissões */}
              {isExpanded && (
                <div className="p-3 pl-10 space-y-2 bg-white">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        disabled={disabled}
                      />
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        <div className="text-sm text-gray-500">
                          {permission.slug}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contador */}
      <div className="text-sm text-gray-500">
        {selectedIds.length} permissão(ões) selecionada(s)
      </div>
    </div>
  );
}
```

### 7.2 RoleForm

```typescript
// components/features/roles/RoleForm/RoleForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PermissionSelector } from '../PermissionSelector';
import { Role, CreateRoleDto } from '@/types';

const roleSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).default([]),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: CreateRoleDto) => Promise<void>;
  isLoading?: boolean;
}

export function RoleForm({ role, onSubmit, isLoading }: RoleFormProps) {
  const isEditing = !!role;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? '',
      slug: role?.slug ?? '',
      description: role?.description ?? '',
      permissionIds: role?.permissions.map((p) => p.id) ?? [],
    },
  });

  const selectedPermissionIds = watch('permissionIds');

  const handleFormSubmit = async (data: RoleFormData) => {
    await onSubmit(data);
  };

  // Auto-gera slug a partir do nome
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register('name').onChange(e);

    if (!isEditing) {
      const slug = e.target.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      setValue('slug', slug);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Perfil</label>
        <Input
          {...register('name')}
          onChange={handleNameChange}
          placeholder="Ex: Gerente de Vendas"
          disabled={role?.isSystem}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium mb-1">Identificador (slug)</label>
        <Input
          {...register('slug')}
          placeholder="Ex: gerente-vendas"
          disabled={isEditing}
        />
        {errors.slug && (
          <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>
        )}
        {isEditing && (
          <p className="text-sm text-gray-500 mt-1">
            O identificador não pode ser alterado
          </p>
        )}
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <Textarea
          {...register('description')}
          placeholder="Descreva as responsabilidades deste perfil..."
          rows={3}
          disabled={role?.isSystem}
        />
      </div>

      {/* Permissões */}
      <div>
        <label className="block text-sm font-medium mb-2">Permissões</label>
        <PermissionSelector
          selectedIds={selectedPermissionIds}
          onChange={(ids) => setValue('permissionIds', ids)}
          disabled={role?.isSystem}
        />
      </div>

      {/* Aviso de perfil do sistema */}
      {role?.isSystem && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Este é um perfil do sistema e não pode ser editado.
          </p>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={role?.isSystem}>
          {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
        </Button>
      </div>
    </form>
  );
}
```

### 7.3 UserRoleAssignment

```typescript
// components/features/roles/UserRoleAssignment/UserRoleAssignment.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useRoles } from '@/hooks/queries/useRoles';
import { User, Role } from '@/types';
import { cn } from '@/lib/utils';

interface UserRoleAssignmentProps {
  user: User;
  onSave: (roleIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

export function UserRoleAssignment({
  user,
  onSave,
  isLoading,
}: UserRoleAssignmentProps) {
  const { data: roles } = useRoles();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    user.roles.map((r) => r.id)
  );

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    await onSave(selectedRoleIds);
  };

  const hasChanges =
    JSON.stringify(selectedRoleIds.sort()) !==
    JSON.stringify(user.roles.map((r) => r.id).sort());

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Perfis do Usuário</h3>

      <div className="border rounded-lg divide-y">
        {roles?.map((role) => (
          <label
            key={role.id}
            className={cn(
              'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50',
              !role.isActive && 'opacity-50'
            )}
          >
            <Checkbox
              checked={selectedRoleIds.includes(role.id)}
              onChange={() => toggleRole(role.id)}
              disabled={!role.isActive}
            />
            <div className="flex-1">
              <div className="font-medium">{role.name}</div>
              <div className="text-sm text-gray-500">{role.description}</div>
              <div className="text-xs text-gray-400 mt-1">
                {role.permissions.length} permissão(ões)
              </div>
            </div>
            {role.isSystem && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Sistema
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          isLoading={isLoading}
          disabled={!hasChanges}
        >
          Salvar Perfis
        </Button>
      </div>
    </div>
  );
}
```

---

## 8. Páginas

### 8.1 Lista de Perfis

```typescript
// app/(dashboard)/settings/roles/page.tsx
import { Metadata } from 'next';
import { RoleList } from '@/components/features/roles';
import { Can } from '@/components/auth/Can';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Perfis de Acesso',
};

export default function RolesPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Perfis de Acesso</h1>
          <p className="text-gray-600">
            Gerencie os perfis e suas permissões
          </p>
        </div>

        <Can permission="roles.manage">
          <Link href="/settings/roles/new">
            <Button>Novo Perfil</Button>
          </Link>
        </Can>
      </div>

      <RoleList />
    </div>
  );
}
```

### 8.2 Criar Perfil

```typescript
// app/(dashboard)/settings/roles/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { RoleForm } from '@/components/features/roles';
import { useCreateRole } from '@/hooks/queries/useRoles';
import { toast } from 'sonner';

export default function NewRolePage() {
  const router = useRouter();
  const createRole = useCreateRole();

  const handleSubmit = async (data) => {
    try {
      await createRole.mutateAsync(data);
      toast.success('Perfil criado com sucesso!');
      router.push('/settings/roles');
    } catch (error) {
      toast.error('Erro ao criar perfil');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Novo Perfil</h1>

      <RoleForm onSubmit={handleSubmit} isLoading={createRole.isPending} />
    </div>
  );
}
```

---

## 9. Resumo

### Componentes Criados

| Componente | Descrição |
|------------|-----------|
| `Can` | Renderização condicional por permissão |
| `CanNot` | Renderização condicional inversa |
| `PermissionSelector` | Seletor de permissões com agrupamento |
| `RoleForm` | Formulário de criação/edição de perfil |
| `UserRoleAssignment` | Atribuição de perfis a usuário |

### Hooks Criados

| Hook | Descrição |
|------|-----------|
| `usePermissions` | Verificação de permissões do usuário atual |
| `useRoles` | CRUD de perfis |
| `usePermissionsList` | Lista de permissões |
| `usePermissionsGrouped` | Permissões agrupadas por recurso |

### Fluxo de Verificação

```
Usuário → AuthStore → usePermissions → Can → Render/Hide
                                    ↓
                              PermissionsGuard (middleware)
                                    ↓
                              Acesso Permitido/Negado
```

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição              |
|------------|--------|--------------|------------------------|
| 2026-02-11 | 1.0.0  | Arquiteto    | Versão inicial         |
