'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, RotateCcw, XCircle, Loader2, AlertTriangle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { usersService, User } from '@/services/users.service';
import { cn } from '@/lib/utils';

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  [Priority.MEDIUM]: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
  [Priority.HIGH]: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  [Priority.CRITICAL]: { label: 'Crítica', className: 'bg-red-100 text-red-800' },
};

export default function TrashPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'project' | 'user' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, usersData] = await Promise.all([
        projectsService.getDeleted(),
        usersService.getDeleted(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading deleted items:', err);
      setError('Erro ao carregar itens excluídos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestoreProject = async (project: Project) => {
    setRestoringId(project.id);
    try {
      await projectsService.restore(project.id);
      await loadData();
    } catch (err) {
      console.error('Error restoring project:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreUser = async (user: User) => {
    setRestoringId(user.id);
    try {
      await usersService.restore(user.id);
      await loadData();
    } catch (err) {
      console.error('Error restoring user:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    try {
      if (itemToDelete.type === 'project') {
        await projectsService.permanentDelete(itemToDelete.id);
      } else {
        await usersService.permanentDelete(itemToDelete.id);
      }
      setShowDeleteDialog(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error permanently deleting:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: string, name: string, type: 'project' | 'user') => {
    setItemToDelete({ id, name, type });
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const formatDeletedDate = (deletedAt?: string | null) =>
    deletedAt
      ? format(new Date(deletedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
      : 'Data desconhecida';

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
              Itens excluídos podem ser restaurados ou removidos permanentemente
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
          <Button variant="link" onClick={loadData} className="ml-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            Projetos {projects.length > 0 && `(${projects.length})`}
          </TabsTrigger>
          <TabsTrigger value="users">
            Usuários {users.length > 0 && `(${users.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <Trash2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum projeto excluído
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum projeto foi excluído ainda
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const priority = priorityConfig[project.priority];

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
                            <span>Excluído em: {formatDeletedDate(project.deletedAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreProject(project)}
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
                            onClick={() => confirmDelete(project.id, project.title, 'project')}
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
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <UserX className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum usuário excluído
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum usuário foi excluído ainda
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="bg-white dark:bg-gray-900 border-red-200 dark:border-red-900">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="secondary" className="text-xs">
                              {role.name}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Email: {user.email}</span>
                          {user.phone && <span>Telefone: {user.phone}</span>}
                          <span>Excluído em: {formatDeletedDate(user.deletedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreUser(user)}
                          disabled={restoringId === user.id}
                        >
                          {restoringId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          Restaurar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDelete(user.id, user.name, 'user')}
                          disabled={deletingId === user.id}
                        >
                          {deletingId === user.id ? (
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
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.{' '}
              {itemToDelete?.type === 'project' ? 'O projeto' : 'O usuário'}{' '}
              <strong>{itemToDelete?.name}</strong> será permanentemente removido
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
