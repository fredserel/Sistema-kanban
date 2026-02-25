# ADR-0004: Zustand e TanStack Query para Gerenciamento de Estado

## Status

**Aceito** (Atualizado)

## Contexto

A aplicação frontend precisa gerenciar dois tipos de estado:

1. **Estado do Cliente (UI)**: Tema, sidebar, modais, preferências
2. **Estado do Servidor**: Dados da API, cache, sincronização

A solução deve ser:
- Leve e performática
- Fácil de usar e manter
- Com bom suporte a TypeScript
- Com DevTools para debugging

## Decisão

Utilizaremos uma combinação de:

- **Zustand 4.x** para estado do cliente
- **TanStack Query 5.x** para estado do servidor

> **Nota**: TanStack Query é o novo nome do React Query a partir da versão 5.
> A biblioteca foi renomeada para refletir que agora suporta outros frameworks
> além do React (Vue, Solid, Svelte).

### Separação de Responsabilidades

```typescript
// Zustand - Estado do Cliente
import { create } from 'zustand';

const useUIStore = create((set) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
}));

// TanStack Query - Estado do Servidor
import { useQuery } from '@tanstack/react-query';

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
    staleTime: 60_000,
  });
}
```

### Quando Usar Cada Um

| Zustand | TanStack Query |
|---------|----------------|
| UI state (modais, sidebar) | Dados da API |
| Preferências do usuário | Cache de servidor |
| Tema da aplicação | Sincronização |
| Estado de formulários globais | Mutações |
| Dados efêmeros | Dados persistidos no backend |

## Consequências

### Positivas

- **Separação clara**: Cliente vs Servidor
- **Zustand é minimalista**: ~1KB, sem boilerplate
- **TanStack Query otimiza**: Cache, deduplicação, background refetch
- **DevTools excelentes**: Debug fácil em ambos
- **TypeScript first**: Ambas bibliotecas têm ótimo suporte
- **Framework agnostic**: TanStack Query suporta Vue, Solid, Svelte além de React

### Negativas

- **Duas bibliotecas**: Curva de aprendizado dupla
- **Decisão sobre onde colocar estado**: Pode gerar dúvidas
- **Migração de Redux**: Se vier de Redux, conceitos diferentes

### Neutras

- Precisa configurar providers
- DevTools são extensões separadas

## Alternativas Consideradas

### Alternativa 1: Redux Toolkit

- **Prós**: Padrão da indústria, RTK Query integrado
- **Contras**: Mais boilerplate, mais complexo
- **Por que não foi escolhida**: Overhead desnecessário

### Alternativa 2: Jotai

- **Prós**: Atômico, inspirado em Recoil
- **Contras**: Padrão diferente, menos intuitivo para alguns
- **Por que não foi escolhida**: Zustand mais direto para nosso caso

### Alternativa 3: Context API + useSWR

- **Prós**: Nativo do React, menos dependências
- **Contras**: Context não é otimizado para updates frequentes
- **Por que não foi escolhida**: Performance inferior em escala

## Referências

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand vs Redux](https://docs.pmnd.rs/zustand/getting-started/comparison)

---

**Data**: 2026-02-11
**Autor**: Arquiteto de Software
**Revisores**: Frontend Lead
