import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, PRIORITY_LABELS, PRIORITY_COLORS, STAGE_LABELS } from '../types';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AlertCircle, Lock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  draggable?: boolean;
}

export function ProjectCard({ project, onClick, draggable = true }: ProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentStage = project.stages.find(
    (s) => s.stageName === project.currentStage
  );
  const isDelayed =
    currentStage &&
    currentStage.status !== 'COMPLETED' &&
    currentStage.plannedEndDate &&
    isPast(new Date(currentStage.plannedEndDate));
  const isBlocked = currentStage?.status === 'BLOCKED';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'hover:shadow-md transition-shadow',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-50',
        isDelayed && 'border-red-400 border-2',
        isBlocked && 'border-yellow-400 border-2'
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{project.title}</h3>
          <Badge className={cn('shrink-0 text-xs', PRIORITY_COLORS[project.priority])}>
            {PRIORITY_LABELS[project.priority]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{project.owner.name}</span>
        </div>

        {currentStage && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Prazo:{' '}
              {currentStage.plannedEndDate
                ? format(new Date(currentStage.plannedEndDate), 'dd/MM/yyyy', { locale: ptBR })
                : 'A definir'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">
                  {getInitials(member.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{project.members.length - 3}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isDelayed && (
              <span title="Atrasado">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </span>
            )}
            {isBlocked && (
              <span title={`Bloqueado: ${currentStage?.blockReason}`}>
                <Lock className="h-4 w-4 text-yellow-500" />
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
