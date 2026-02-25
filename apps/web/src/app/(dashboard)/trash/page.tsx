'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, RotateCcw, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { projectsService, Project, Priority } from '@/services/projects.service';
import { cn } from '@/lib/utils';

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  [Priority.MEDIUM]: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
  [Priority.HIGH]: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  [Priority.CRITICAL]: { label: 'Crítica', className: 'bg-red-100 text-red-800' },
};

export default function TrashPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsService.getDeleted();
      setProjects(data);
    } catch (err) {
      console.error('Error loading deleted projects:', err);
      setError('Erro ao carregar projetos excluídos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRestore = async (project: Project) => {
    setRestoringId(project.id);
    try {
      await projectsService.restore(project.id);
      await loadProjects();
    } catch (err) {
      console.error('Error restoring project:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!projectToDelete) return;

    setDeletingId(projectToDelete.id);
    try {
      await projectsService.permanentDelete(projectToDelete.id);
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      await loadProjects();
    } catch (err) {
      console.error('Error permanently deleting project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lixeira
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Projetos excluídos podem ser restaurados ou removidos permanentemente
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
          <Button variant="link" onClick={loadProjects} className="ml-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <Trash2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Lixeira vazia
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum projeto foi excluído ainda
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const priority = priorityConfig[project.priority];
            const deletedDate = project.deletedAt
              ? format(new Date(project.deletedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
              : 'Data desconhecida';

            return (
              <Card key={project.id} className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.title}
                        </h3>
                        <Badge variant="secondary" className={cn('text-xs', priority.className)}>
                          {priority.label}
                        </Badge>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Responsável: {project.owner?.name || 'N/A'}</span>
                        <span>Excluído em: {deletedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(project)}
                        disabled={restoringId === project.id}
                      >
                        {restoringId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Restaurar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(project)}
                        disabled={deletingId === project.id}
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O projeto{' '}
              <strong>{projectToDelete?.title}</strong> será permanentemente removido
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
