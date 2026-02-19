import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LayoutDashboard, Plus, Users, LogOut, Trash2, Shield } from 'lucide-react';

export function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Kanban', icon: LayoutDashboard, permission: 'projects.read' },
  ];

  if (hasPermission('projects.create')) {
    navItems.push({ href: '/projects/new', label: 'Novo Projeto', icon: Plus, permission: 'projects.create' });
  }

  if (hasPermission('users.read')) {
    navItems.push({ href: '/users', label: 'Usuarios', icon: Users, permission: 'users.read' });
  }

  if (hasPermission('roles.read')) {
    navItems.push({ href: '/roles', label: 'Perfis', icon: Shield, permission: 'roles.read' });
  }

  if (hasPermission('trash.read')) {
    navItems.push({ href: '/trash', label: 'Lixeira', icon: Trash2, permission: 'trash.read' });
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = () => {
    if (!user?.roles || user.roles.length === 0) return 'Sem perfil';
    return user.roles.map(r => r.displayName).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Conectenvios" className="h-8" />
                <span className="text-lg font-bold text-conectenvios-dark-gray">
                  Projetos <span className="text-conectenvios-orange">Conectenvios</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link key={item.href} to={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={`gap-2 ${isActive ? '' : 'text-conectenvios-dark-gray hover:text-conectenvios-orange hover:bg-orange-50'}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-conectenvios-orange text-white font-semibold">
                      {user ? getInitials(user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">{getRoleDisplay()}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-conectenvios-red cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
