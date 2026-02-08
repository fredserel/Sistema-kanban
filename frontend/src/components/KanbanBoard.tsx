import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Project, StageName, STAGE_ORDER } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { ProjectCard } from './ProjectCard';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface KanbanBoardProps {
  projects: Project[];
  onMoveProject: (
    projectId: string,
    targetStage: StageName,
    justification?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onProjectClick: (project: Project) => void;
}

export function KanbanBoard({ projects, onMoveProject, onProjectClick }: KanbanBoardProps) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    projectId: string;
    targetStage: StageName;
  } | null>(null);
  const [justification, setJustification] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getProjectsByStage = (stage: StageName) => {
    return projects.filter((project) => project.currentStage === stage);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveProject(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const project = projects.find((p) => p.id === active.id);
    if (!project) return;

    const targetStage = over.id as StageName;
    if (project.currentStage === targetStage) return;

    const currentIndex = STAGE_ORDER.indexOf(project.currentStage);
    const targetIndex = STAGE_ORDER.indexOf(targetStage);

    // Verifica se precisa de justificativa (retorno ou pulo de etapa)
    const isGoingBack = targetIndex < currentIndex;
    const isSkipping = targetIndex > currentIndex + 1;

    if (isGoingBack || (isSkipping && user?.role === 'ADMIN')) {
      setPendingMove({ projectId: project.id, targetStage });
      setShowJustificationDialog(true);
      return;
    }

    const result = await onMoveProject(project.id, targetStage);
    if (!result.success) {
      setMoveError(result.error || 'Erro ao mover projeto');
    }
  };

  const handleConfirmMove = async () => {
    if (!pendingMove) return;

    const result = await onMoveProject(
      pendingMove.projectId,
      pendingMove.targetStage,
      justification
    );

    if (result.success) {
      setShowJustificationDialog(false);
      setPendingMove(null);
      setJustification('');
    } else {
      setMoveError(result.error || 'Erro ao mover projeto');
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              projects={getProjectsByStage(stage)}
              onProjectClick={onProjectClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProject && <ProjectCard project={activeProject} />}
        </DragOverlay>
      </DndContext>

      <Dialog open={showJustificationDialog} onOpenChange={setShowJustificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa necessaria</DialogTitle>
            <DialogDescription>
              Esta movimentacao requer uma justificativa. Por favor, explique o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Justificativa</Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explique o motivo da movimentacao..."
                rows={4}
              />
            </div>
            {moveError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {moveError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowJustificationDialog(false);
                setPendingMove(null);
                setJustification('');
                setMoveError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmMove} disabled={!justification.trim()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!moveError && !showJustificationDialog} onOpenChange={() => setMoveError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro ao mover projeto</DialogTitle>
            <DialogDescription>{moveError}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMoveError(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
