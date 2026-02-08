# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack Kanban project management system with a 6-stage pipeline workflow.

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL

## Commands

### Backend (from `backend/` directory)

```bash
npm install                      # Install dependencies
npx prisma generate              # Generate Prisma client
npx prisma migrate dev --name X  # Run migrations
npm run prisma:seed              # Seed test data (3 users)
npm run dev                      # Start dev server (port 3001)
npm run build                    # Build for production
npm run start                    # Run production build
```

### Frontend (from `frontend/` directory)

```bash
npm install      # Install dependencies
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # ESLint with --max-warnings 0
```

### Docker

```bash
docker-compose up -d  # Start PostgreSQL container
```

## Architecture

### Backend Structure (`backend/src/`)

Layered architecture: **Controllers → Services → Prisma Client**

- `controllers/` - HTTP request handlers (auth, project, stage, user)
- `services/` - Business logic including audit logging
- `routes/` - Express route definitions
- `middlewares/auth.middleware.ts` - JWT verification and RBAC
- `index.ts` - Express app entry point

### Frontend Structure (`frontend/src/`)

- `components/` - React components including shadcn/ui in `ui/`
- `pages/` - Route pages (Login, Kanban, ProjectForm, Users)
- `services/` - Axios API client with JWT interceptors
- `contexts/AuthContext.tsx` - Global auth state
- `hooks/useKanban.ts` - Kanban board logic
- `App.tsx` - React Router configuration

### Database Schema (`backend/prisma/schema.prisma`)

Key models: User, Project, ProjectStage, ProjectMember, Comment, AuditLog

Enums:
- **Role**: ADMIN, MANAGER, MEMBER
- **Priority**: LOW, MEDIUM, HIGH, CRITICAL
- **StageName**: NAO_INICIADO, MODELAGEM_NEGOCIO, MODELAGEM_TI, DESENVOLVIMENTO, HOMOLOGACAO, FINALIZADO
- **StageStatus**: PENDING, IN_PROGRESS, COMPLETED, BLOCKED

## Key Patterns

1. **Auth Flow**: JWT stored in localStorage, Axios interceptors add Bearer token automatically
2. **RBAC**: Middleware checks user role for route access (ADMIN > MANAGER > MEMBER)
3. **Audit Trail**: All project/stage actions logged with old/new values
4. **6-Stage Pipeline**: Projects must follow fixed stage order unless user is ADMIN
5. **Drag & Drop**: @dnd-kit/core for Kanban board interactions

## API Base URL

Development: `http://localhost:3001/api`

Frontend Vite dev server proxies `/api` requests to backend.

## Environment Variables

Backend `.env` requires:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `JWT_EXPIRES_IN` - Token expiration (default: 24h)
- `PORT` - Server port (default: 3001)

## Test Users (after seeding)

- admin@sistema.com / admin123 (ADMIN)
- gerente@sistema.com / gerente123 (MANAGER)
- membro@sistema.com / membro123 (MEMBER)

## Role Permissions

| Action | ADMIN | MANAGER | MEMBER |
|--------|-------|---------|--------|
| Create/Edit Project | Yes | Yes | No |
| Delete Project | Yes | No | No |
| Move Stages | Yes | Yes | No |
| Skip Stages | Yes | No | No |
| Manage Users | Yes | No | No |
