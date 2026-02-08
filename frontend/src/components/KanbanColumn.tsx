import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Project, StageName, STAGE_LABELS } from '../types';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  stage: StageName;
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function KanbanColumn({ stage, projects, onProjectClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  const columnColors: Record<StageName, string> = {
    NAO_INICIADO: 'bg-gray-100',
    MODELAGEM_NEGOCIO: 'bg-blue-50',
    MODELAGEM_TI: 'bg-purple-50',
    DESENVOLVIMENTO: 'bg-yellow-50',
    HOMOLOGACAO: 'bg-orange-50',
    FINALIZADO: 'bg-green-50',
  };

  const headerColors: Record<StageName, string> = {
    NAO_INICIADO: 'bg-gray-200',
    MODELAGEM_NEGOCIO: 'bg-blue-200',
    MODELAGEM_TI: 'bg-purple-200',
    DESENVOLVIMENTO: 'bg-yellow-200',
    HOMOLOGACAO: 'bg-orange-200',
    FINALIZADO: 'bg-green-200',
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-lg min-w-[280px] w-[280px]',
        columnColors[stage],
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className={cn('p-3 rounded-t-lg', headerColors[stage])}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h2>
          <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium">
            {projects.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick(project)}
            />
          ))}
        </SortableContext>
        {projects.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhum projeto
          </div>
        )}
      </div>
    </div>
  );
}
