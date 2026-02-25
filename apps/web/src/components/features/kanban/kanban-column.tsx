'use client';

import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  loading?: boolean;
  children: ReactNode;
}

export function KanbanColumn({ id, title, count, loading, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[500px] min-w-[200px] transition-colors duration-200',
        isOver && 'bg-primary/10 ring-2 ring-primary ring-inset'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          {title}
        </h2>
        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
          {count}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : count === 0 ? (
        <div className={cn(
          'text-sm text-gray-500 dark:text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg',
          isOver && 'border-primary bg-primary/5'
        )}>
          {isOver ? 'Soltar aqui' : 'Nenhum projeto'}
        </div>
      ) : (
        <div className="space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
