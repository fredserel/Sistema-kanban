'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Project } from '@/services/projects.service';
import { ProjectCard } from './project-card';
import { cn } from '@/lib/utils';

interface DraggableProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function DraggableProjectCard({ project, onClick }: DraggableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50'
      )}
    >
      <div
        {...listeners}
        {...attributes}
        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div onClick={onClick}>
        <ProjectCard project={project} />
      </div>
    </div>
  );
}
