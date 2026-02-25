'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useCreateRole, useUpdateRole, useGroupedPermissions } from '@/hooks/queries/use-roles';
import { Role } from '@/services/roles.service';

const roleSchema = z.object({
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').regex(/^[a-z0-9-]+$/, 'Apenas letras minusculas, numeros e hifens'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  isActive: z.boolean(),
  permissionIds: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
}

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

export function RoleFormDialog({ open, onOpenChange, role }: RoleFormDialogProps) {
  const isEditing = !!role;
  const isSystemRole = role?.isSystem ?? false;
  const { data: groupedPermissions } = useGroupedPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      slug: '',
      name: '',
      description: '',
      isActive: true,
      permissionIds: [],
    },
  });

  const selectedPermissionIds = watch('permissionIds');

  useEffect(() => {
    if (open) {
      if (role) {
        reset({
          slug: role.slug,
          name: role.name,
          description: role.description || '',
          isActive: role.isActive,
          permissionIds: role.permissions?.map((p) => p.id) || [],
        });
      } else {
        reset({
          slug: '',
          name: '',
          description: '',
          isActive: true,
          permissionIds: [],
        });
      }
    }
  }, [open, role, reset]);

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing) {
        await updateRole.mutateAsync({
          id: role.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            isActive: data.isActive,
            permissionIds: data.permissionIds,
          },
        });
      } else {
        await createRole.mutateAsync({
          slug: data.slug,
          name: data.name,
          description: data.description || undefined,
          permissionIds: data.permissionIds,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const togglePermission = (permissionId: string) => {
    if (isSystemRole) return;
    const current = selectedPermissionIds || [];
    if (current.includes(permissionId)) {
      setValue('permissionIds', current.filter((id) => id !== permissionId));
    } else {
      setValue('permissionIds', [...current, permissionId]);
    }
  };

  const toggleResourcePermissions = (resource: string, permissions: { id: string }[]) => {
    if (isSystemRole) return;
    const current = selectedPermissionIds || [];
    const resourcePermIds = permissions.map((p) => p.id);
    const allSelected = resourcePermIds.every((id) => current.includes(id));

    if (allSelected) {
      setValue('permissionIds', current.filter((id) => !resourcePermIds.includes(id)));
    } else {
      const newIds = Array.from(new Set([...current, ...resourcePermIds]));
      setValue('permissionIds', newIds);
    }
  };

  const isPending = createRole.isPending || updateRole.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
            {isSystemRole && (
              <Badge variant="warning" className="ml-2 text-xs">
                Perfil do Sistema
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSystemRole
              ? 'Perfis do sistema nao podem ser editados.'
              : isEditing
              ? 'Atualize as informacoes e permissoes do perfil.'
              : 'Crie um novo perfil com as permissoes desejadas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug')}
                disabled={isEditing}
                placeholder="ex: gerente-ti"
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="ex: Gerente de TI"
                disabled={isSystemRole}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Descricao do perfil"
              disabled={isSystemRole}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissoes</Label>
            {isSystemRole && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Permissoes de perfis do sistema nao podem ser alteradas.
              </p>
            )}
            <div className="border rounded-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0">
                {groupedPermissions &&
                  Object.entries(groupedPermissions).map(([resource, permissions]) => {
                    const resourcePermIds = permissions.map((p) => p.id);
                    const allSelected = resourcePermIds.every((id) =>
                      selectedPermissionIds?.includes(id)
                    );
                    const someSelected =
                      !allSelected &&
                      resourcePermIds.some((id) => selectedPermissionIds?.includes(id));

                    return (
                      <div key={resource} className="border-b sm:border-r last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800">
                          <Checkbox
                            id={`resource-${resource}`}
                            checked={allSelected}
                            disabled={isSystemRole}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement).dataset.state = someSelected
                                  ? 'indeterminate'
                                  : allSelected
                                  ? 'checked'
                                  : 'unchecked';
                              }
                            }}
                            onCheckedChange={() =>
                              toggleResourcePermissions(resource, permissions)
                            }
                          />
                          <label
                            htmlFor={`resource-${resource}`}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {RESOURCE_LABELS[resource] || resource}
                          </label>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          {permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={selectedPermissionIds?.includes(permission.id)}
                                disabled={isSystemRole}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-sm cursor-pointer"
                                title={permission.description}
                              >
                                {permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              disabled={isSystemRole}
              onCheckedChange={(checked) => setValue('isActive', !!checked)}
            />
            <label htmlFor="isActive" className="text-sm cursor-pointer">
              Perfil ativo
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isSystemRole ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isSystemRole && (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
