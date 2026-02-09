import { Priority, User, PRIORITY_LABELS } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Search, X, AlertTriangle } from 'lucide-react';
import { ProjectFilters } from '../services/project.service';

interface KanbanFiltersProps {
  filters: ProjectFilters;
  users: User[];
  onFilterChange: (filters: Partial<ProjectFilters>) => void;
  onClearFilters: () => void;
}

export function KanbanFilters({
  filters,
  users,
  onFilterChange,
  onClearFilters,
}: KanbanFiltersProps) {
  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== '' && v !== false
  );

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-lg border mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.priority || ''}
        onValueChange={(value) =>
          onFilterChange({ priority: (value as Priority) || undefined })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.ownerId || ''}
        onValueChange={(value) =>
          onFilterChange({ ownerId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={filters.delayed ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => onFilterChange({ delayed: !filters.delayed })}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        Atrasados
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
