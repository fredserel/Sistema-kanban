import { create } from 'zustand';

export interface KanbanFilters {
  search: string;
  priority: string;
  owner: string;
  member: string;
  delayed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  priority: string;
  currentStage: string;
  owner: {
    id: string;
    name: string;
  };
  stages: Array<{
    id: string;
    stageName: string;
    status: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
    blockReason?: string;
  }>;
  members: Array<{
    user: {
      id: string;
      name: string;
    };
    role: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface KanbanState {
  filters: KanbanFilters;
  selectedProject: Project | null;
  isDetailOpen: boolean;
}

interface KanbanActions {
  setFilters: (filters: Partial<KanbanFilters>) => void;
  resetFilters: () => void;
  setSelectedProject: (project: Project | null) => void;
  openDetail: (project: Project) => void;
  closeDetail: () => void;
}

type KanbanStore = KanbanState & KanbanActions;

const defaultFilters: KanbanFilters = {
  search: '',
  priority: '',
  owner: '',
  member: '',
  delayed: false,
};

export const useKanbanStore = create<KanbanStore>((set) => ({
  // State
  filters: defaultFilters,
  selectedProject: null,
  isDetailOpen: false,

  // Actions
  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  setSelectedProject: (project) => {
    set({ selectedProject: project });
  },

  openDetail: (project) => {
    set({ selectedProject: project, isDetailOpen: true });
  },

  closeDetail: () => {
    set({ isDetailOpen: false });
  },
}));
