# Documentação de Arquitetura

## Índice da Documentação

Este diretório contém toda a documentação técnica de arquitetura do projeto.

### Estrutura

```
docs/
├── architecture/
│   ├── README.md                    # Este arquivo (índice)
│   ├── 01-VISAO-GERAL.md           # Visão geral da arquitetura
│   ├── 02-FRONTEND.md              # Arquitetura do Frontend (Next.js)
│   ├── 03-BACKEND.md               # Arquitetura do Backend (NestJS + Fastify)
│   ├── 04-BANCO-DE-DADOS.md        # Estrutura de dados (MariaDB + TypeORM)
│   ├── 05-AUTENTICACAO.md          # Fluxo de autenticação (JWT + Passport)
│   ├── 06-INFRAESTRUTURA.md        # Docker e infraestrutura
│   ├── 07-MENSAGERIA-EMAIL.md      # Amazon SES e e-mails
│   ├── 08-INTERNACIONALIZACAO.md   # i18n (pt-BR, en, es)
│   ├── 09-PERFIS-PERMISSOES.md     # Sistema RBAC completo
│   ├── 10-FRONTEND-PERFIS.md       # UI de gerenciamento de perfis
│   │
│   ├── diagrams/
│   │   ├── c4-context.md           # Diagrama C4 - Contexto
│   │   ├── c4-container.md         # Diagrama C4 - Containers
│   │   ├── c4-component.md         # Diagrama C4 - Componentes
│   │   └── data-flow.md            # Diagramas de fluxo de dados
│   │
│   └── adr/
│       ├── template.md             # Template para novos ADRs
│       ├── 0001-uso-turborepo.md   # ADR: Escolha do Turborepo
│       ├── 0002-nextjs-app-router.md
│       ├── 0003-nestjs-backend.md  # Atualizado: NestJS + Fastify
│       └── 0004-zustand-react-query.md
│
├── templates/                       # TEMPLATES PARA NOVOS PROJETOS
│   ├── STACK-TEMPLATE.md           # Template Node.js/TypeScript
│   ├── QUICK-REFERENCE.md          # Referência rápida Node.js
│   │
│   └── php/                        # TEMPLATES PHP
│       ├── STACK-TEMPLATE-PHP.md   # Template Laravel + Inertia
│       └── QUICK-REFERENCE-PHP.md  # Referência rápida PHP
│
└── guides/
    ├── SETUP.md                    # Guia de configuração inicial
    └── DEVELOPMENT.md              # Guia de desenvolvimento
```

---

## Stack Tecnológico

| Camada      | Tecnologia                  | Versão    |
|-------------|------------------------------|-----------|
| Monorepo    | Turborepo                    | 2.0       |
| Frontend    | Next.js (App Router)         | 14.x      |
| UI          | shadcn/ui + TailwindCSS      | -         |
| Componentes | Radix UI                     | -         |
| Estado      | Zustand + TanStack Query     | 4.x / 5.x |
| HTTP        | Axios                        | 1.x       |
| i18n Front  | next-intl                    | 3.x       |
| Backend     | NestJS + Fastify             | 10.x      |
| ORM         | TypeORM                      | 0.3.x     |
| Auth        | JWT + Passport               | -         |
| i18n Back   | nestjs-i18n                  | 10.x      |
| Database    | MariaDB                      | 10.11     |
| E-mail      | Amazon SES                   | -         |
| Runtime     | Node.js                      | ≥18       |
| Container   | Docker Compose               | 3.8       |

### Idiomas Suportados

| Código  | Idioma     | Status       |
|---------|------------|--------------|
| `pt-BR` | Português  | ✅ Principal  |
| `en`    | English    | ✅ Secundário |
| `es`    | Español    | 🔜 Futuro     |

---

## Quick Links

- [Visão Geral da Arquitetura](./01-VISAO-GERAL.md)
- [Guia de Setup](../guides/SETUP.md)
- [Guia de Desenvolvimento](../guides/DEVELOPMENT.md)
- [ADRs (Decisões de Arquitetura)](./adr/)

---

## Iniciar Novo Projeto

Para iniciar um novo projeto com esta stack:

1. **Copie o template**: `docs/templates/STACK-TEMPLATE.md`
2. **Consulta rápida**: `docs/templates/QUICK-REFERENCE.md`

---

## 📦 Stacks Disponíveis

### Stack Node.js/TypeScript
| Camada   | Tecnologia              |
|----------|-------------------------|
| Monorepo | Turborepo 2.0           |
| Frontend | Next.js 14 + shadcn/ui  |
| Backend  | NestJS 10 + Fastify     |
| Database | MariaDB + TypeORM       |
| i18n     | next-intl + nestjs-i18n |

### Stack PHP
| Camada   | Tecnologia              |
|----------|-------------------------|
| Backend  | Laravel 11              |
| Frontend | Inertia.js + Vue 3      |
| UI       | shadcn-vue + Tailwind   |
| Database | MariaDB + Eloquent      |
| i18n     | Laravel Localization    |

---

## Convenções de Documentação

### Formato dos Documentos

1. **Títulos**: Use Markdown headers hierárquicos (H1 > H2 > H3)
2. **Código**: Use blocos de código com syntax highlighting
3. **Diagramas**: Use Mermaid para diagramas inline
4. **Referências**: Links relativos para outros documentos

### Manutenção

- Atualize a documentação junto com mudanças de código
- Revise ADRs quando decisões forem alteradas
- Mantenha diagramas sincronizados com a implementação

---

**Última atualização**: Fevereiro 2026
