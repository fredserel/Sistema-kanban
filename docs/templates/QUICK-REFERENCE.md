# Quick Reference - Stack Padrão

> Cartão de referência rápida para consulta durante desenvolvimento.

---

## Stack Resumida

```
┌─────────────────────────────────────────────────────────────┐
│                    TURBOREPO 2.0 (pnpm)                     │
├─────────────────────────────┬───────────────────────────────┤
│         FRONTEND            │           BACKEND             │
│         (apps/web)          │          (apps/api)           │
├─────────────────────────────┼───────────────────────────────┤
│ Next.js 14 (App Router)     │ NestJS 10 + Fastify           │
│ React 18                    │ TypeORM 0.3                   │
│ shadcn/ui + Tailwind        │ Passport + JWT                │
│ Radix UI                    │ Class Validator               │
│ Zustand (client state)      │ Swagger/OpenAPI               │
│ TanStack Query (server)     │ Amazon SES                    │
│ Axios                       │ @fastify/helmet               │
│ next-intl (i18n)            │ nestjs-i18n                   │
├─────────────────────────────┴───────────────────────────────┤
│  🌍 IDIOMAS: pt-BR (principal) │ en (secundário) │ es (futuro)│
├─────────────────────────────────────────────────────────────┤
│                    INFRAESTRUTURA                           │
│  MariaDB 10.11  │  Redis (cache)  │  Docker Compose 3.8     │
└─────────────────────────────────────────────────────────────┘
```

---

## Comandos Essenciais

| Ação                    | Comando                              |
|-------------------------|--------------------------------------|
| Dev mode                | `pnpm dev`                           |
| Build                   | `pnpm build`                         |
| Docker up               | `docker-compose up -d`               |
| Add shadcn component    | `npx shadcn-ui@latest add [name]`    |
| Create migration        | `pnpm migration:generate`            |
| Run migrations          | `pnpm migration:run`                 |

---

## Imports Comuns

### Frontend

```typescript
// TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Zustand
import { create } from 'zustand';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// i18n (next-intl)
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';

// Utils
import { cn } from '@/lib/utils';
```

### Backend

```typescript
// NestJS
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// Fastify Types
import { FastifyRequest, FastifyReply } from 'fastify';

// i18n (nestjs-i18n)
import { I18nService } from 'nestjs-i18n';

// Guards
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
```

---

## Estrutura de Pastas

```
project/
├── apps/
│   ├── web/src/
│   │   ├── app/[locale]/  # Pages com locale
│   │   ├── components/ui/ # shadcn/ui
│   │   ├── hooks/         # Custom hooks
│   │   ├── i18n/          # Configuração i18n
│   │   ├── messages/      # pt-BR.json, en.json
│   │   ├── services/      # API calls
│   │   ├── stores/        # Zustand
│   │   └── lib/utils.ts   # cn() helper
│   │
│   └── api/src/
│       ├── main.ts        # Fastify bootstrap
│       ├── modules/       # Domain modules
│       ├── common/        # Guards, filters, etc
│       ├── i18n/          # pt-BR/, en/
│       └── database/      # Migrations, seeds
│
├── packages/              # Shared code
├── docker/                # Dockerfiles
└── docs/                  # Documentation
```

---

## Portas Padrão

| Serviço   | Porta |
|-----------|-------|
| Frontend  | 3000  |
| Backend   | 3001  |
| MariaDB   | 3306  |
| Redis     | 6379  |
| Swagger   | 3001/api/docs |

---

## Variáveis de Ambiente Obrigatórias

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=app_pass
DB_NAME=app_db

# JWT
JWT_SECRET=sua-chave-secreta

# CORS
CORS_ORIGIN=http://localhost:3000

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_EMAIL=noreply@example.com
```

---

## Padrões de Código

### Nomenclatura

| Tipo           | Padrão          | Exemplo              |
|----------------|-----------------|----------------------|
| Componentes    | PascalCase      | `UserProfile.tsx`    |
| Hooks          | camelCase       | `useAuth.ts`         |
| Stores         | camelCase       | `useAuthStore.ts`    |
| Services       | camelCase       | `user.service.ts`    |
| DTOs           | PascalCase      | `CreateUserDto`      |
| Entities       | PascalCase      | `User`               |
| Pastas         | kebab-case      | `user-profile/`      |

### Zustand Store

```typescript
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

### TanStack Query Hook

```typescript
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });
}
```

### NestJS Controller

```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}
```

---

---

## i18n Quick Reference

### Idiomas

| Código  | Idioma     | Status   |
|---------|------------|----------|
| `pt-BR` | Português  | Principal|
| `en`    | English    | Secundário|
| `es`    | Español    | Futuro   |

### Frontend (next-intl)

```typescript
// Tradução simples
const t = useTranslations('auth');
t('login'); // "Entrar" ou "Sign In"

// Com interpolação
t('welcome', { name: 'João' }); // "Olá, João!"

// Link com locale
<Link href="/dashboard">Dashboard</Link>

// Trocar idioma
const router = useRouter();
router.replace(pathname, { locale: 'en' });
```

### Backend (nestjs-i18n)

```typescript
// No service
this.i18n.t('auth.LOGIN_FAILED');

// Com variáveis
this.i18n.t('validation.MIN_LENGTH', {
  args: { field: 'senha', min: 8 }
});
```

---

**v1.1.0 | Fevereiro 2026** (+ i18n)
