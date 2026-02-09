import { useState, useMemo } from 'react';
import { useKanban } from '../hooks/useKanban';
import { KanbanBoard } from '../components/KanbanBoard';
import { KanbanFilters } from '../components/KanbanFilters';
import { ProjectDetailModal } from '../components/ProjectDetailModal';
import { Project, User } from '../types';
import { getProject } from '../services/project.service';

export function Kanban() {
  const {
    projects,
    isLoading,
    error,
    filters,
    handleMoveProject,
    updateFilters,
    clearFilters,
    refetch,
  } = useKanban();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const owners = useMemo(() => {
    const map = new Map<string, User>();
    for (const p of projects) {
      if (!map.has(p.owner.id)) {
        map.set(p.owner.id, { id: p.owner.id, name: p.owner.name, email: p.owner.email, role: 'MEMBER' });
      }
    }
    return Array.from(map.values());
  }, [projects]);

  const handleProjectClick = async (project: Project) => {
    try {
      const fullProject = await getProject(project.id);
      setSelectedProject(fullProject);
      setShowDetail(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes do projeto:', err);
    }
  };

  const handleProjectUpdate = async () => {
    if (selectedProject) {
      try {
        const fullProject = await getProject(selectedProject.id);
        setSelectedProject(fullProject);
      } catch (err) {
        console.error('Erro ao atualizar projeto:', err);
      }
    }
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="text-primary underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <KanbanFilters
        filters={filters}
        users={owners}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
      />

      <KanbanBoard
        projects={projects}
        onMoveProject={handleMoveProject}
        onProjectClick={handleProjectClick}
      />

      <ProjectDetailModal
        project={selectedProject}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={handleProjectUpdate}
      />
    </div>
  );
}
