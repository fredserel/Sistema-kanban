# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Run all apps (api + web) in dev mode
pnpm dev

# Run individual apps
pnpm api:dev          # NestJS API on port 3001
pnpm web:dev          # Next.js frontend on port 3000

# Build all
pnpm build

# Lint all
pnpm lint

# Database
pnpm db:migrate       # Run TypeORM migrations
pnpm db:seed          # Seed roles, permissions, and test users

# Run a specific workspace command
pnpm --filter @kanban/api <command>
pnpm --filter @kanban/web <command>

# Docker
pnpm docker:up        # Start MariaDB + services
pnpm docker:down
```

### Test Users (after seed)
- `admin@sistema.com` / `admin123` — super-admin (all permissions)
- `gerente@sistema.com` / `gerente123` — manager
- `membro@sistema.com` / `membro123` — operator

## Architecture

**Monorepo** using pnpm workspaces + Turborepo. Node >= 20, pnpm >= 9.

### Workspace Layout

- `apps/api` — **NestJS 10 + Fastify** backend (`@kanban/api`), port 3001
- `apps/web` — **Next.js 14 App Router** frontend (`@kanban/web`), port 3000
- `packages/types` — Shared TypeScript interfaces/enums (`@kanban/types`), no build step
- `packages/config` — Shared tsconfig bases (base, nestjs, nextjs)

### Backend (apps/api)

**NestJS + Fastify** with global prefix `/api/v1`. Swagger at `/api/docs` in dev.

**Database:** TypeORM + MariaDB. Uses `synchronize: true` in dev (no migration files yet). Entities use UUID primary keys, soft-delete on Users and Projects.

**Modules:** Auth, Users, Roles, Permissions, Projects, Stages, Audit, Database.

**Auth:** Passport JWT (Bearer token, 7d expiry) + refresh tokens (30d, `JWT_REFRESH_SECRET`). `@Public()` decorator bypasses JWT guard. `@Permissions(...)` decorator + `PermissionsGuard` for RBAC. `isSuperAdmin` bypasses all permission checks.

**RBAC:** 27 permissions across 6 resources (users, roles, projects, stages, audit, trash). 5 system roles: super-admin, admin, manager, operator, viewer. Roles support hierarchy (`parentId`).

**Stage Pipeline (ordered):** NAO_INICIADO → MODELAGEM_NEGOCIO → MODELAGEM_TI → DESENVOLVIMENTO → HOMOLOGACAO → FINALIZADO. Moving backwards requires a justification string.

**Global middleware:** AllExceptionsFilter, TransformInterceptor (wraps responses as `{ success, data, timestamp }`), LoggingInterceptor, ValidationPipe (whitelist + transform), ThrottlerModule (100 req/60s), Helmet, CORS, Compress.

### Frontend (apps/web)

**Next.js 14 App Router** with `output: 'standalone'`.

**Route groups:**
- `(auth)/login` — public login page
- `(dashboard)/kanban` — main kanban board with drag-and-drop (@dnd-kit)
- `(dashboard)/users` — user management CRUD
- `(dashboard)/roles` — roles management
- `(dashboard)/trash` — soft-deleted project recovery

**State:** Zustand stores for auth (persisted to localStorage), kanban filters, and UI state (sidebar, theme). TanStack Query v5 for server state with query key factories in `src/hooks/queries/`.

**API client:** Axios instance at `src/services/api/client.ts`. Request interceptor injects Bearer token. Response interceptor handles 401 with automatic refresh-token retry.

**Styling:** Tailwind CSS 3.4 (class-based dark mode) + shadcn/ui components in `src/components/ui/`. Brand colors: `conectenvios.orange` (#FF6900), `conectenvios.yellow` (#FFCD00). Utility `cn()` from `src/lib/utils.ts`.

**Auth protection** is done via `useAuthStore` check in the dashboard layout (not Next.js middleware). Permission-filtered sidebar hides nav items based on user permissions.

### API Response Envelope

All API responses follow: `{ success: boolean, data?: T, error?: { statusCode, message, details, path, timestamp }, timestamp: string }`. Frontend service files unwrap this envelope.

## Key Conventions

- The business brand is **Conectenvios**; internal package names use **kanban**
- All UI labels, stage names, and priority labels are in **Portuguese (pt-BR)**
- Date formatting uses `date-fns` with `ptBR` locale
- Path aliases: `@/*` maps to `src/*` in both apps
- Frontend services are in `src/services/api/` — each resource has its own service file
- React Query hooks are in `src/hooks/queries/` — follow existing pattern with query key factories
- Permission slugs follow the pattern `resource.action` (e.g., `users.create`, `projects.update`)

## Environment Variables

See `.env.example`. Key vars: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (missing from .env.example but used in code), `API_PORT`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`.
