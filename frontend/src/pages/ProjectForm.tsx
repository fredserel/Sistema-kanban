import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Priority, StageName, STAGE_LABELS, PRIORITY_LABELS, STAGE_ORDER } from '../types';
import { createProject, getUsers } from '../services/project.service';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';

interface StageDate {
  stageName: StageName;
  plannedStartDate: string;
  plannedEndDate: string;
}

export function ProjectForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<User[]>([]);
  const [stageDates, setStageDates] = useState<StageDate[]>(
    STAGE_ORDER.map((stageName) => ({
      stageName,
      plannedStartDate: '',
      plannedEndDate: '',
    }))
  );

  useEffect(() => {
    getUsers()
      .then((users) => setManagers(users.filter((u) => u.role === 'MANAGER')))
      .catch(console.error);
  }, []);

  const handleStageChange = (
    index: number,
    field: 'plannedStartDate' | 'plannedEndDate',
    value: string
  ) => {
    setStageDates((prev) => {
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
      const stagesToSend = stageDates
        .filter((s) => s.plannedStartDate || s.plannedEndDate)
        .map((s) => ({
          stageName: s.stageName,
          ...(s.plannedStartDate && { plannedStartDate: s.plannedStartDate }),
          ...(s.plannedEndDate && { plannedEndDate: s.plannedEndDate }),
        }));

      await createProject({
        title,
        managerId,
        description: description || undefined,
        priority,
        ...(stagesToSend.length > 0 && { stages: stagesToSend }),
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Informacoes Basicas */}
        <Card>
          <CardHeader>
            <CardTitle>Novo Projeto</CardTitle>
            <CardDescription>Preencha as informacoes do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nome do Projeto *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do projeto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Gerente Responsavel *</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar gerente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
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
                placeholder="Descreva o projeto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="w-full sm:w-[200px]">
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
          </CardContent>
        </Card>

        {/* Cronograma das Etapas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma das Etapas
            </CardTitle>
            <CardDescription>
              Defina as datas planejadas para cada etapa (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stageDates.map((stage, index) => (
                <div
                  key={stage.stageName}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="font-medium text-sm mb-3">
                    {STAGE_LABELS[stage.stageName]}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Data Inicio
                      </Label>
                      <Input
                        type="date"
                        value={stage.plannedStartDate}
                        onChange={(e) =>
                          handleStageChange(index, 'plannedStartDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Data Fim
                      </Label>
                      <Input
                        type="date"
                        value={stage.plannedEndDate}
                        onChange={(e) =>
                          handleStageChange(index, 'plannedEndDate', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Botoes */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !title || !managerId}
            className="w-full sm:w-auto gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
