import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, PRIORITY_LABELS, PRIORITY_COLORS, STAGE_LABELS } from '../types';
import {
  getDeletedProjects,
  restoreProject,
  permanentDeleteProject,
} from '../services/project.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Trash() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDeletedProjects = async () => {
    try {
      setIsLoading(true);
      const data = await getDeletedProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lixeira');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedProjects();
  }, []);

  const handleRestore = async (projectId: string) => {
    setActionLoading(projectId);
    try {
      await restoreProject(projectId);
      fetchDeletedProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar projeto');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (projectId: string, title: string) => {
    if (!window.confirm(`Excluir permanentemente "${title}"? Esta ação não pode ser desfeita.`)) return;
    setActionLoading(projectId);
    try {
      await permanentDeleteProject(projectId);
      fetchDeletedProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir permanentemente');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Lixeira</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projetos Excluídos</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum projeto na lixeira.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{project.title}</p>
                      <Badge className={cn('text-xs', PRIORITY_COLORS[project.priority])}>
                        {PRIORITY_LABELS[project.priority]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Responsável: {project.owner.name}</span>
                      <span>Etapa: {STAGE_LABELS[project.currentStage]}</span>
                      {project.deletedAt && (
                        <span>
                          Excluído em: {format(new Date(project.deletedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(project.id)}
                      disabled={actionLoading === project.id}
                      className="gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePermanentDelete(project.id, project.title)}
                      disabled={actionLoading === project.id}
                      className="gap-1 text-red-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
