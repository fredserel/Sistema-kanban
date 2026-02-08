import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import {
  Priority,
  StageName,
  PRIORITY_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
} from '../types';
import { createProject } from '../services/project.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface StageDate {
  stageName: StageName;
  plannedStartDate: string;
  plannedEndDate: string;
}

export function ProjectForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const getDefaultDates = (): StageDate[] => {
    return STAGE_ORDER.map((stageName, index) => ({
      stageName,
      plannedStartDate: format(addDays(today, index * 14), 'yyyy-MM-dd'),
      plannedEndDate: format(addDays(today, (index + 1) * 14 - 1), 'yyyy-MM-dd'),
    }));
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [stages, setStages] = useState<StageDate[]>(getDefaultDates());

  const handleStageChange = (
    index: number,
    field: 'plannedStartDate' | 'plannedEndDate',
    value: string
  ) => {
    setStages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await createProject({
        title,
        description: description || undefined,
        priority,
        stages: stages.map((s) => ({
          stageName: s.stageName,
          plannedStartDate: s.plannedStartDate,
          plannedEndDate: s.plannedEndDate,
        })),
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do projeto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao do projeto"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Cronograma das Etapas</h3>
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div
                    key={stage.stageName}
                    className="grid grid-cols-[1fr,150px,150px] gap-4 items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-medium text-sm">
                      {index + 1}. {STAGE_LABELS[stage.stageName]}
                    </span>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Inicio</Label>
                      <Input
                        type="date"
                        value={stage.plannedStartDate}
                        onChange={(e) =>
                          handleStageChange(index, 'plannedStartDate', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fim</Label>
                      <Input
                        type="date"
                        value={stage.plannedEndDate}
                        onChange={(e) =>
                          handleStageChange(index, 'plannedEndDate', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Projeto'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
