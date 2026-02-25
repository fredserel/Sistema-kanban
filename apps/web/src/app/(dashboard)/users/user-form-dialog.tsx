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
import { useCreateUser, useUpdateUser } from '@/hooks/queries/use-users';
import { useRoles } from '@/hooks/queries/use-roles';
import { User } from '@/services/users.service';

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  phone: z.string().optional(),
  isActive: z.boolean(),
  roleIds: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEditing = !!user;
  const { data: roles } = useRoles();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      isEditing
        ? userSchema.omit({ password: true }).extend({
            password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
          })
        : userSchema.extend({
            password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
          })
    ),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      isActive: true,
      roleIds: [],
    },
  });

  const selectedRoleIds = watch('roleIds');

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          password: '',
          phone: user.phone || '',
          isActive: user.isActive,
          roleIds: user.roles.map((r) => r.id),
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          phone: '',
          isActive: true,
          roleIds: [],
        });
      }
    }
  }, [open, user, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            name: data.name,
            email: data.email,
            password: data.password || undefined,
            phone: data.phone || undefined,
            isActive: data.isActive,
            roleIds: data.roleIds,
          },
        });
      } else {
        await createUser.mutateAsync({
          name: data.name,
          email: data.email,
          password: data.password!,
          phone: data.phone || undefined,
          roleIds: data.roleIds,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const toggleRole = (roleId: string) => {
    const current = selectedRoleIds || [];
    if (current.includes(roleId)) {
      setValue('roleIds', current.filter((id) => id !== roleId));
    } else {
      setValue('roleIds', [...current, roleId]);
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do usuário.'
              : 'Preencha os dados para criar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {isEditing && '(deixe em branco para manter)'}
            </Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label>Perfis</Label>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[150px] overflow-y-auto">
              {roles?.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds?.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <label
                    htmlFor={`role-${role.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', !!checked)}
            />
            <label htmlFor="isActive" className="text-sm cursor-pointer">
              Usuário ativo
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
