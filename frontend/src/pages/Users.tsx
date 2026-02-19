import { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { getUsers } from '../services/project.service';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Users() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuarios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get<Role[]>('/roles');
      setRoles(response.data);
      // Set default role to first non-super-admin role
      const defaultRole = response.data.find(r => r.name === 'OPERATOR') || response.data[0];
      if (defaultRole) {
        setNewUser(prev => ({ ...prev, roleId: defaultRole.id }));
      }
    } catch (err) {
      console.error('Erro ao carregar perfis:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/users', {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        roleId: newUser.roleId,
      });
      setShowNewUser(false);
      const defaultRole = roles.find(r => r.name === 'OPERATOR') || roles[0];
      setNewUser({ name: '', email: '', password: '', roleId: defaultRole?.id || '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'ADMIN':
        return 'bg-orange-100 text-orange-800';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {hasPermission('users.create') && (
          <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil</Label>
                  <Select
                    value={newUser.roleId}
                    onValueChange={(v) => setNewUser({ ...newUser, roleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar perfil..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewUser(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      {user.active === false && (
                        <UserX className="h-4 w-4 text-red-500" title="Usuario desativado" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                        {role.displayName}
                      </Badge>
                    ))
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Sem perfil</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
