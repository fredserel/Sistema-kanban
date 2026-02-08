import { useState, useEffect, useCallback } from 'react';
import { Project, StageName, Priority, STAGE_ORDER } from '../types';
import { getProjects, moveProject, ProjectFilters } from '../services/project.service';

export function useKanban() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({});

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProjects(filters);
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getProjectsByStage = (stage: StageName) => {
    return projects.filter((project) => project.currentStage === stage);
  };

  const handleMoveProject = async (
    projectId: string,
    targetStage: StageName,
    justification?: string
  ) => {
    try {
      const updatedProject = await moveProject(projectId, targetStage, justification);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updatedProject : p))
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao mover projeto',
      };
    }
  };

  const updateFilters = (newFilters: Partial<ProjectFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    projects,
    isLoading,
    error,
    filters,
    stages: STAGE_ORDER,
    getProjectsByStage,
    handleMoveProject,
    updateFilters,
    clearFilters,
    refetch: fetchProjects,
  };
}
