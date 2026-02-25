'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Shield,
  Trash2,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';

const navigation = [
  { name: 'Kanban', href: '/kanban', icon: FolderKanban, permission: 'kanban.view' },
  { name: 'Usuários', href: '/users', icon: Users, permission: 'users.read' },
  { name: 'Perfis', href: '/roles', icon: Shield, permission: 'roles.read', superAdminOnly: true },
  { name: 'Lixeira', href: '/trash', icon: Trash2, permission: 'trash.read' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { hasPermission, user } = useAuthStore();

  const filteredNavigation = navigation.filter((item) => {
    if (item.superAdminOnly && !user?.isSuperAdmin) return false;
    return hasPermission(item.permission);
  });

  return (
    <aside
      className={cn(
        'flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {sidebarCollapsed ? (
          <Link href="/kanban" className="mx-auto">
            <Image
              src="/icon-conectenvios.svg"
              alt="Conectenvios"
              width={32}
              height={32}
              priority
              className="h-8 w-8"
            />
          </Link>
        ) : (
          <Link href="/kanban" className="flex items-center">
            <Image
              src="/logo-conectenvios.svg"
              alt="Conectenvios"
              width={150}
              height={40}
              priority
              className="h-8 w-auto"
            />
          </Link>
        )}
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
      {sidebarCollapsed && (
        <div className="flex justify-center py-2 border-b border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings - super admin only */}
      {user?.isSuperAdmin && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === '/settings'
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              sidebarCollapsed && 'justify-center'
            )}
            title={sidebarCollapsed ? 'Configurações' : undefined}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Configurações</span>}
          </Link>
        </div>
      )}
    </aside>
  );
}
