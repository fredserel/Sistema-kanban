import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Project,
  User as UserType,
  Priority,
  StageName,
  STAGE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  StageStatus,
  STAGE_ORDER,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { completeStage, blockStage, unblockStage } from '../services/stage.service';
import {
  addComment,
  getUsers,
  addProjectMember,
  removeProjectMember,
  changeProjectOwner,
  updateProject,
  deleteProject,
} from '../services/project.service';
import {
  Calendar,
  User,
  CheckCircle,
  Lock,
  Unlock,
  MessageSquare,
  UserPlus,
  UserMinus,
  Users,
  Pencil,
  Save,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectDetailModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const STATUS_LABELS: Record<StageStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
  BLOCKED: 'Bloqueado',
};

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
  onUpdate,
}: ProjectDetailModalProps) {
  const { user: authUser, hasRole } = useAuth();
  const [blockReason, setBlockReason] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editStages, setEditStages] = useState<
    { stageName: StageName; plannedStartDate: string; plannedEndDate: string }[]
  >([]);

  const isAdmin = hasRole('ADMIN');
  const isOwner = authUser?.id === project?.ownerId;
  const canEdit = isAdmin || isOwner;

  useEffect(() => {
    if (open && canEdit) {
      getUsers().then(setUsers).catch(console.error);
    }
  }, [open, canEdit]);

  useEffect(() => {
    if (project) {
      setSelectedOwner(project.owner.id);
      setIsEditing(false);
    }
  }, [project]);

  const startEditing = () => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setEditPriority(project.priority);
    setEditStages(
      STAGE_ORDER.map((stageName) => {
        const stage = project.stages.find((s) => s.stageName === stageName);
        return {
          stageName,
          plannedStartDate: stage?.plannedStartDate
            ? format(new Date(stage.plannedStartDate), 'yyyy-MM-dd')
            : '',
          plannedEndDate: stage?.plannedEndDate
            ? format(new Date(stage.plannedEndDate), 'yyyy-MM-dd')
            : '',
        };
      })
    );
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!project) return;
    setIsLoading(true);
    setError(null);
    try {
      const stagesToSend = editStages
        .filter((s) => s.plannedStartDate || s.plannedEndDate)
        .map((s) => ({
          stageName: s.stageName,
          ...(s.plannedStartDate && { plannedStartDate: s.plannedStartDate }),
          ...(s.plannedEndDate && { plannedEndDate: s.plannedEndDate }),
        }));

      await updateProject(project.id, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        ...(stagesToSend.length > 0 && { stages: stagesToSend }),
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  const currentStage = project.stages.find(
    (s) => s.stageName === project.currentStage
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCompleteStage = async () => {
    if (!currentStage) return;
    setIsLoading(true);
    setError(null);
    try {
      await completeStage(currentStage.id);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir etapa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockStage = async () => {
    if (!currentStage || !blockReason.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await blockStage(currentStage.id, blockReason);
      setBlockReason('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao bloquear etapa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockStage = async () => {
    if (!currentStage) return;
    setIsLoading(true);
    setError(null);
    try {
      await unblockStage(currentStage.id);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desbloquear etapa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await addComment(project.id, comment);
      setComment('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedMember) return;
    setIsLoading(true);
    setError(null);
    try {
      await addProjectMember(project.id, selectedMember);
      setSelectedMember('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await removeProjectMember(project.id, userId);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover membro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeOwner = async () => {
    if (!selectedOwner || selectedOwner === project.owner.id) return;
    setIsLoading(true);
    setError(null);
    try {
      await changeProjectOwner(project.id, selectedOwner);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar responsável');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm('Tem certeza que deseja mover este projeto para a lixeira?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await deleteProject(project.id);
      onOpenChange(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const availableMembers = users.filter(
    (u) => !project.members.some((m) => m.user.id === u.id) && u.id !== project.owner.id
  );

  const handleStageEditChange = (
    index: number,
    field: 'plannedStartDate' | 'plannedEndDate',
    value: string
  ) => {
    setEditStages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'A definir';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateShort = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'A definir';
    return format(new Date(dateStr), 'dd/MM');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-semibold"
              />
            ) : (
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
            )}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Priority)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={cn(PRIORITY_COLORS[project.priority])}>
                  {PRIORITY_LABELS[project.priority]}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Edit / Delete / Save / Cancel buttons */}
          {canEdit && !isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={startEditing} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar Projeto
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteProject}
                  disabled={isLoading}
                  className="gap-2 text-red-600 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Projeto
                </Button>
              )}
            </div>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={isLoading} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Description */}
          {isEditing ? (
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descrição do projeto"
                rows={3}
              />
            </div>
          ) : (
            project.description && (
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Responsável: {project.owner.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Criado em: {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Stages */}
          <div>
            <h4 className="font-medium mb-3">Etapas</h4>
            <div className="space-y-2">
              {project.stages.map((stage) => {
                const editStage = editStages.find((e) => e.stageName === stage.stageName);
                const stageIndex = editStages.findIndex((e) => e.stageName === stage.stageName);

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      stage.stageName === project.currentStage && 'bg-primary/5 border-primary'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {STAGE_LABELS[stage.stageName]}
                      </span>
                      <Badge className={cn('text-xs', STATUS_COLORS[stage.status])}>
                        {STATUS_LABELS[stage.status]}
                      </Badge>
                    </div>
                    {isEditing && editStage ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Início Planejado</Label>
                          <Input
                            type="date"
                            value={editStage.plannedStartDate}
                            onChange={(e) =>
                              handleStageEditChange(stageIndex, 'plannedStartDate', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Fim Planejado</Label>
                          <Input
                            type="date"
                            value={editStage.plannedEndDate}
                            onChange={(e) =>
                              handleStageEditChange(stageIndex, 'plannedEndDate', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          Planejado: {formatDateShort(stage.plannedStartDate)} -{' '}
                          {formatDate(stage.plannedEndDate)}
                        </div>
                        {stage.actualStartDate && (
                          <div>
                            Real: {formatDateShort(stage.actualStartDate)}
                            {stage.actualEndDate &&
                              ` - ${formatDate(stage.actualEndDate)}`}
                          </div>
                        )}
                      </div>
                    )}
                    {stage.status === 'BLOCKED' && stage.blockReason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        Motivo: {stage.blockReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage actions - only for canEdit */}
          {canEdit && currentStage && !isEditing && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Ações</h4>
              <div className="flex flex-wrap gap-2">
                {currentStage.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleCompleteStage}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Concluir Etapa
                    </Button>
                    <div className="flex items-center gap-2">
                      <Textarea
                        placeholder="Motivo do bloqueio..."
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="h-9 min-h-0 w-[200px]"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBlockStage}
                        disabled={isLoading || !blockReason.trim()}
                        className="gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Bloquear
                      </Button>
                    </div>
                  </>
                )}
                {currentStage.status === 'BLOCKED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnblockStage}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Unlock className="h-4 w-4" />
                    Desbloquear
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Owner change - ADMIN only */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Responsável do Projeto
            </h4>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleChangeOwner}
                  disabled={isLoading || selectedOwner === project.owner.id}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <p className="text-sm">{project.owner.name}</p>
            )}
          </div>

          {/* Team management - canEdit */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe do Projeto
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.user.name}</span>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      disabled={isLoading}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {project.members.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum membro na equipe</span>
              )}
            </div>
            {canEdit && availableMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Adicionar membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={isLoading || !selectedMember}
                  className="gap-1"
                >
                  <UserPlus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </h4>
            <div className="space-y-3 mb-4">
              {project.comments?.map((c) => (
                <div key={c.id} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{c.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(c.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              {(!project.comments || project.comments.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum comentário</p>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
              <Button onClick={handleAddComment} disabled={isLoading || !comment.trim()}>
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
