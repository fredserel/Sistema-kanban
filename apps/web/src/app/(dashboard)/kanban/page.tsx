'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { projectsService, Project, StageName } from '@/services/projects.service';
import { stagesService } from '@/services/stages.service';
import { CreateProjectModal } from '@/components/features/projects/create-project-modal';
import { ProjectCard } from '@/components/features/projects/project-card';
import { DraggableProjectCard } from '@/components/features/projects/draggable-project-card';
import { KanbanColumn } from '@/components/features/kanban/kanban-column';
import { ProjectDetailModal } from '@/components/features/projects/project-detail-modal';

const STAGE_CONFIG: { name: StageName; label: string }[] = [
  { name: StageName.NAO_INICIADO, label: 'Não Iniciado' },
  { name: StageName.MODELAGEM_NEGOCIO, label: 'Modelagem Negócio' },
  { name: StageName.MODELAGEM_TI, label: 'Modelagem TI' },
  { name: StageName.DESENVOLVIMENTO, label: 'Desenvolvimento' },
  { name: StageName.HOMOLOGACAO, label: 'Homologação' },
  { name: StageName.FINALIZADO, label: 'Finalizado' },
];

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsService.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const getProjectsByStage = (stageName: StageName) => {
    return projects.filter((p) => p.currentStage === stageName);
  };

  const handleProjectCreated = () => {
    setCreateModalOpen(false);
    loadProjects();
  };

  const handleProjectUpdated = () => {
    setSelectedProject(null);
    loadProjects();
  };

  const handleProjectDeleted = () => {
    setSelectedProject(null);
    loadProjects();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find((p) => p.id === active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) return;

    const projectId = active.id as string;
    const targetStage = over.id as StageName;

    const project = projects.find((p) => p.id === projectId);
    if (!project || project.currentStage === targetStage) return;

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, currentStage: targetStage } : p
      )
    );

    setIsMoving(true);
    try {
      await stagesService.moveProject(projectId, {
        targetStage,
        justification: 'Movido via drag-and-drop',
      });
    } catch (err) {
      console.error('Error moving project:', err);
      // Revert on error
      loadProjects();
    } finally {
      setIsMoving(false);
    }
  };

  const handleDragCancel = () => {
    setActiveProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kanban Board
        </h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
          <Button variant="link" onClick={loadProjects} className="ml-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-6 gap-4 overflow-x-auto">
          {STAGE_CONFIG.map((stage) => {
            const stageProjects = getProjectsByStage(stage.name);
            return (
              <KanbanColumn
                key={stage.name}
                id={stage.name}
                title={stage.label}
                count={stageProjects.length}
                loading={loading}
              >
                {stageProjects.map((project) => (
                  <DraggableProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeProject ? (
            <div className="rotate-3 opacity-90">
              <ProjectCard project={activeProject} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isMoving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Movendo projeto...
        </div>
      )}

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleProjectCreated}
      />

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
          onUpdated={handleProjectUpdated}
          onDeleted={handleProjectDeleted}
        />
      )}
    </div>
  );
}
