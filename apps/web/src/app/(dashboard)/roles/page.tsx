'use client';

import { useState } from 'react';
import { Plus, Shield, ShieldAlert, Users, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRoles, useDeleteRole } from '@/hooks/queries/use-roles';
import { useAuthStore } from '@/stores/auth.store';
import { RoleFormDialog } from './role-form-dialog';
import { Role } from '@/services/roles.service';

const RESOURCE_LABELS: Record<string, string> = {
  users: 'Usuarios',
  projects: 'Projetos',
  stages: 'Etapas',
  kanban: 'Kanban',
  roles: 'Perfis',
  trash: 'Lixeira',
  reports: 'Relatorios',
  settings: 'Configuracoes',
  audit: 'Auditoria',
};

function groupPermissions(permissions: Role['permissions']) {
  const grouped: Record<string, string[]> = {};
  for (const perm of permissions) {
    const resource = RESOURCE_LABELS[perm.resource] || perm.resource;
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(perm.name);
  }
  return grouped;
}

function RoleCard({
  role,
  onEdit,
  onDelete,
  isSuperAdmin,
}: {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  isSuperAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const grouped = groupPermissions(role.permissions || []);
  const permCount = role.permissions?.length || 0;
  const isSystemRole = role.isSystem;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                {isSystemRole && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Sistema
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                <Users className="h-3 w-3" />
                <span>{role.userCount} usuario(s)</span>
              </div>
            </div>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(role)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!isSystemRole && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(role)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{role.description || '-'}</p>
      </div>

      {/* Permissions toggle */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <span className="font-medium">Permissoes ({permCount})</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-1">
            {Object.entries(grouped).map(([resource, actions]) =>
              actions.map((action) => (
                <div
                  key={`${resource}-${action}`}
                  className="text-sm text-gray-600 dark:text-gray-400 py-0.5"
                >
                  <span className="text-gray-900 dark:text-gray-200">{resource}:</span>{' '}
                  {action}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { user } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { data: roles, isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const isSuperAdmin = user?.isSuperAdmin === true;

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <ShieldAlert className="h-16 w-16 text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Acesso Restrito</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Apenas Super Administradores podem gerenciar perfis e permissoes.
        </p>
      </div>
    );
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (roleToDelete) {
      await deleteRole.mutateAsync(roleToDelete.id);
      setIsDeleteOpen(false);
      setRoleToDelete(null);
    }
  };

  const confirmDelete = (role: Role) => {
    setRoleToDelete(role);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfis e Permissoes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie os perfis de acesso do sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : roles && roles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">Nenhum perfil encontrado</div>
      )}

      <RoleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        role={selectedRole}
      />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o perfil{' '}
              <strong>{roleToDelete?.name}</strong>? Usuarios com este perfil
              perderao as permissoes associadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
