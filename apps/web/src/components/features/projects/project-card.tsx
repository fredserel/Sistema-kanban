'use client';

import { CalendarDays, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Project, Priority } from '@/services/projects.service';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]: { label: 'Baixa', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  [Priority.MEDIUM]: { label: 'Média', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  [Priority.HIGH]: { label: 'Alta', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  [Priority.CRITICAL]: { label: 'Crítica', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const priority = priorityConfig[project.priority];
  const initials = project.owner?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  const createdDate = new Date(project.createdAt).toLocaleDateString('pt-BR');

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
            {project.title}
          </h3>
          {project.priority === Priority.CRITICAL && (
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          )}
        </div>

        {project.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn('text-xs', priority.className)}>
            {priority.label}
          </Badge>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <CalendarDays className="h-3 w-3" />
              {createdDate}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
              {project.owner?.name || 'Sem dono'}
            </span>
          </div>

          {project.members && project.members.length > 0 && (
            <div className="flex -space-x-1">
              {project.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-5 w-5 border-2 border-white dark:border-gray-900">
                  <AvatarFallback className="text-[10px] bg-gray-200 dark:bg-gray-700">
                    {member.user?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.members.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] border-2 border-white dark:border-gray-900">
                  +{project.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
