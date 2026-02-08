import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Project,
  STAGE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  StageStatus,
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
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { completeStage, blockStage, unblockStage } from '../services/stage.service';
import { addComment } from '../services/project.service';
import {
  Calendar,
  User,
  CheckCircle,
  Lock,
  Unlock,
  MessageSquare,
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
  COMPLETED: 'Concluido',
  BLOCKED: 'Bloqueado',
};

export function ProjectDetailModal({
  project,
  open,
  onOpenChange,
  onUpdate,
}: ProjectDetailModalProps) {
  const { hasRole } = useAuth();
  const [blockReason, setBlockReason] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl">{project.title}</DialogTitle>
            <Badge className={cn(PRIORITY_COLORS[project.priority])}>
              {PRIORITY_LABELS[project.priority]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {project.description && (
            <div>
              <h4 className="font-medium mb-2">Descricao</h4>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Responsavel: {project.owner.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Criado em: {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Etapas</h4>
            <div className="space-y-2">
              {project.stages.map((stage) => (
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
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      Planejado: {format(new Date(stage.plannedStartDate), 'dd/MM')} -{' '}
                      {format(new Date(stage.plannedEndDate), 'dd/MM/yyyy')}
                    </div>
                    {stage.actualStartDate && (
                      <div>
                        Real: {format(new Date(stage.actualStartDate), 'dd/MM')}
                        {stage.actualEndDate &&
                          ` - ${format(new Date(stage.actualEndDate), 'dd/MM/yyyy')}`}
                      </div>
                    )}
                  </div>
                  {stage.status === 'BLOCKED' && stage.blockReason && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Motivo: {stage.blockReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {hasRole('ADMIN', 'MANAGER') && currentStage && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Acoes</h4>
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

          <div>
            <h4 className="font-medium mb-3">Membros</h4>
            <div className="flex flex-wrap gap-2">
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
                </div>
              ))}
              {project.members.length === 0 && (
                <span className="text-sm text-muted-foreground">Nenhum membro</span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios
            </h4>
            <div className="space-y-3 mb-4">
              {project.comments?.map((c) => (
                <div key={c.id} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{c.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(c.createdAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              {(!project.comments || project.comments.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum comentario</p>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar comentario..."
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
