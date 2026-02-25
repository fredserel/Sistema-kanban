# ADR-0002: Next.js com App Router

## Status

**Aceito**

## Contexto

O frontend precisa de:

1. Server-Side Rendering (SSR) para SEO e performance inicial
2. Roteamento baseado em sistema de arquivos
3. Otimizações automáticas de bundle
4. Suporte a React Server Components
5. Excelente Developer Experience

A versão 14 do Next.js estabilizou o App Router, trazendo novos paradigmas de desenvolvimento com Server Components por padrão.

## Decisão

Utilizaremos **Next.js 14.1** com **App Router** como framework frontend.

### Estrutura de Rotas

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home (/)
├── (auth)/                 # Grupo de rotas públicas
│   ├── login/page.tsx      # /login
│   └── register/page.tsx   # /register
├── (dashboard)/            # Grupo de rotas protegidas
│   ├── layout.tsx          # Layout com sidebar
│   ├── page.tsx            # /dashboard
│   └── users/
│       ├── page.tsx        # /users
│       └── [id]/page.tsx   # /users/:id
└── api/                    # Route Handlers (BFF)
```

### Padrões Adotados

```typescript
// Server Component (padrão)
export default async function UsersPage() {
  const users = await fetchUsers(); // Fetch no servidor
  return <UserList users={users} />;
}

// Client Component (quando necessário)
'use client';
export function SearchBar() {
  const [query, setQuery] = useState('');
  // ... interatividade
}
```

## Consequências

### Positivas

- **Server Components**: Menor bundle JS, melhor performance
- **Streaming**: Carregamento progressivo com Suspense
- **Caching granular**: Cache em múltiplas camadas
- **Metadata API**: SEO declarativo
- **Route Handlers**: API routes mais poderosas
- **Layouts aninhados**: Composição de layouts

### Negativas

- **Complexidade mental**: Decidir Server vs Client Components
- **Breaking changes**: Algumas libs ainda não suportam App Router
- **Debugging**: Mais complexo debugar SSR issues
- **Hydration mismatches**: Erros comuns em migração

### Neutras

- Necessário entender novo modelo mental de renderização
- Algumas features ainda em evolução

## Alternativas Consideradas

### Alternativa 1: Next.js Pages Router

- **Prós**: Mais estável, mais documentação, maior compatibilidade
- **Contras**: getServerSideProps menos flexível, sem Server Components
- **Por que não foi escolhida**: App Router é o futuro do Next.js

### Alternativa 2: Remix

- **Prós**: Data loading elegante, forms nativos
- **Contras**: Ecossistema menor, menos adoção
- **Por que não foi escolhida**: Next.js tem maior ecossistema e suporte

### Alternativa 3: Vite + React

- **Prós**: Mais simples, mais rápido em dev
- **Contras**: Sem SSR nativo, precisa configurar mais
- **Por que não foi escolhida**: Necessário SSR para SEO

## Referências

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

**Data**: 2026-02-11
**Autor**: Arquiteto de Software
**Revisores**: Tech Lead, Frontend Lead
