import { useState, useEffect } from 'react';
import { Role } from '../types';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Shield, Users, Lock } from 'lucide-react';

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

interface RoleWithPermissions extends Role {
  permissions?: Permission[];
  usersCount?: number;
}

export function Roles() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      const response = await api.get<RoleWithPermissions[]>('/roles');
      setRoles(response.data);
    } catch (err) {
      console.error('Erro ao carregar perfis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceLabel = (resource: string) => {
    const labels: Record<string, string> = {
      users: 'Usuarios',
      roles: 'Perfis',
      projects: 'Projetos',
      stages: 'Etapas',
      reports: 'Relatorios',
      settings: 'Configuracoes',
      trash: 'Lixeira',
    };
    return labels[resource] || resource;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      read: 'Visualizar',
      create: 'Criar',
      update: 'Editar',
      delete: 'Excluir',
      manage: 'Gerenciar',
      complete: 'Concluir',
      block: 'Bloquear',
      export: 'Exportar',
      restore: 'Restaurar',
    };
    return labels[action] || action;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-conectenvios-orange" />
            Perfis e Permissoes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os perfis de acesso do sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`${getRoleBadgeColor(role.name)} text-sm px-3 py-1`}>
                    {role.displayName}
                  </Badge>
                  {role.isSystem && (
                    <Badge variant="outline" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Sistema
                    </Badge>
                  )}
                </div>
                {role.usersCount !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {role.usersCount} usuario(s)
                  </div>
                )}
              </div>
              {role.description && (
                <CardDescription className="mt-2">
                  {role.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Permissoes ({role.permissions?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {role.permissions && role.permissions.length > 0 ? (
                  role.permissions.map((perm) => (
                    <Badge
                      key={perm.id}
                      variant="secondary"
                      className="text-xs"
                      title={perm.description || ''}
                    >
                      {getResourceLabel(perm.resource)}: {getActionLabel(perm.action)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma permissao atribuida
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
