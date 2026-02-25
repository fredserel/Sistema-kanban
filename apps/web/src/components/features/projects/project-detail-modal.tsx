'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  User,
  Users,
  MessageSquare,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  Send,
  UserPlus,
  X,
  Check,
  Ban,
  Play,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Project, Priority, StageName, StageStatus, projectsService, Comment } from '@/services/projects.service';
import { stagesService } from '@/services/stages.service';
import { usersService, User as UserType } from '@/services/users.service';
import { cn } from '@/lib/utils';

interface ProjectDetailModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  [Priority.LOW]: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  [Priority.MEDIUM]: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
  [Priority.HIGH]: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  [Priority.CRITICAL]: { label: 'Crítica', className: 'bg-red-100 text-red-800' },
};

const stageConfig: Record<StageName, string> = {
  [StageName.NAO_INICIADO]: 'Não Iniciado',
  [StageName.MODELAGEM_NEGOCIO]: 'Modelagem Negócio',
  [StageName.MODELAGEM_TI]: 'Modelagem TI',
  [StageName.DESENVOLVIMENTO]: 'Desenvolvimento',
  [StageName.HOMOLOGACAO]: 'Homologação',
  [StageName.FINALIZADO]: 'Finalizado',
};

const statusConfig: Record<StageStatus, { label: string; className: string }> = {
  [StageStatus.PENDING]: { label: 'Pendente', className: 'bg-gray-100 text-gray-800' },
  [StageStatus.IN_PROGRESS]: { label: 'Em Progresso', className: 'bg-blue-100 text-blue-800' },
  [StageStatus.COMPLETED]: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  [StageStatus.BLOCKED]: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
};

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: ProjectDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>(project.comments || []);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [stageActionLoading, setStageActionLoading] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [stageToBlock, setStageToBlock] = useState<string | null>(null);

  const priority = priorityConfig[project.priority];
  const currentStage = stageConfig[project.currentStage];

  useEffect(() => {
    setComments(project.comments || []);
  }, [project.comments]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await usersService.getAll();
        // Filter out users who are already members
        const memberIds = project.members?.map(m => m.userId) || [];
        const filtered = users.filter(u => !memberIds.includes(u.id) && u.id !== project.ownerId);
        setAvailableUsers(filtered);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };
    if (showAddMember) {
      loadUsers();
    }
  }, [showAddMember, project.members, project.ownerId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const comment = await projectsService.addComment(project.id, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      onUpdated?.();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setIsAddingMember(true);
    try {
      await projectsService.addMember(project.id, userId);
      setShowAddMember(false);
      onUpdated?.();
    } catch (err) {
      console.error('Error adding member:', err);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await projectsService.removeMember(project.id, userId);
      onUpdated?.();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const handleCompleteStage = async (stageId: string) => {
    setStageActionLoading(stageId);
    try {
      await stagesService.complete(stageId);
      onUpdated?.();
    } catch (err) {
      console.error('Error completing stage:', err);
    } finally {
      setStageActionLoading(null);
    }
  };

  const handleBlockStage = async () => {
    if (!stageToBlock || !blockReason.trim()) return;

    setStageActionLoading(stageToBlock);
    try {
      await stagesService.block(stageToBlock, blockReason);
      setShowBlockDialog(false);
      setBlockReason('');
      setStageToBlock(null);
      onUpdated?.();
    } catch (err) {
      console.error('Error blocking stage:', err);
    } finally {
      setStageActionLoading(null);
    }
  };

  const handleUnblockStage = async (stageId: string) => {
    setStageActionLoading(stageId);
    try {
      await stagesService.unblock(stageId);
      onUpdated?.();
    } catch (err) {
      console.error('Error unblocking stage:', err);
    } finally {
      setStageActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await projectsService.delete(project.id);
      setShowDeleteDialog(false);
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const ownerInitials = project.owner?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="space-y-1 pr-6">
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={priority.className}>
                  {priority.label}
                </Badge>
                <Badge variant="outline">{currentStage}</Badge>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="stages">Etapas</TabsTrigger>
              <TabsTrigger value="comments">
                Comentários ({project.comments?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              {project.description && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.description}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsável
                  </h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{project.owner?.name}</p>
                      <p className="text-xs text-gray-500">{project.owner?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Datas
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Criado: {format(new Date(project.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    <p>Atualizado: {format(new Date(project.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                </div>
              </div>

              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membros ({project.members?.length || 0})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddMember(!showAddMember)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {showAddMember && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Selecione um usuário para adicionar:
                    </p>
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum usuário disponível</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableUsers.map((user) => (
                          <Button
                            key={user.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMember(user.id)}
                            disabled={isAddingMember}
                          >
                            {user.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {project.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 group"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {member.user?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.user?.name}</span>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(!project.members || project.members.length === 0) && (
                    <p className="text-sm text-gray-500">Nenhum membro adicionado</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-3 mt-4">
              {project.stages?.map((stage) => {
                const status = statusConfig[stage.status];
                const isLoading = stageActionLoading === stage.id;
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      stage.status === StageStatus.IN_PROGRESS && 'border-primary bg-primary/5',
                      stage.status === StageStatus.COMPLETED && 'border-green-500 bg-green-50 dark:bg-green-900/20',
                      stage.status === StageStatus.BLOCKED && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                      stage.status === StageStatus.PENDING && 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {stageConfig[stage.stageName]}
                        </span>
                        <Badge variant="secondary" className={cn('text-xs', status.className)}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {stage.status === StageStatus.IN_PROGRESS && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCompleteStage(stage.id)}
                              disabled={isLoading}
                              className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Concluir
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStageToBlock(stage.id);
                                setShowBlockDialog(true);
                              }}
                              disabled={isLoading}
                              className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Bloquear
                            </Button>
                          </>
                        )}
                        {stage.status === StageStatus.BLOCKED && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnblockStage(stage.id)}
                            disabled={isLoading}
                            className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            Desbloquear
                          </Button>
                        )}
                      </div>
                    </div>
                    {stage.blockReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Motivo do bloqueio: {stage.blockReason}
                      </p>
                    )}
                    {stage.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Concluído em: {format(new Date(stage.completedAt), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3 mt-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                >
                  {isAddingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum comentário ainda</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {comment.user?.name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{comment.user?.name}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              O projeto será movido para a lixeira. Você poderá restaurá-lo depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do bloqueio desta etapa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Motivo do bloqueio..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            rows={3}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!stageActionLoading}
              onClick={() => {
                setBlockReason('');
                setStageToBlock(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockStage}
              disabled={!!stageActionLoading || !blockReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {stageActionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
