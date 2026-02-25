# Template de Stack - Projetos Monorepo

> Template padrão para iniciar novos projetos com stack unificada.
> **Última atualização**: Fevereiro 2026

---

## Stack Tecnológico Oficial

| Camada      | Tecnologia                   | Versão     |
|-------------|------------------------------|------------|
| Monorepo    | Turborepo                    | 2.0        |
| Frontend    | Next.js (App Router)         | 14.x       |
| UI          | shadcn/ui + TailwindCSS      | -          |
| Componentes | Radix UI                     | -          |
| Estado      | Zustand + TanStack Query     | 4.x / 5.x  |
| HTTP Client | Axios                        | 1.x        |
| i18n Front  | next-intl                    | 3.x        |
| Backend     | NestJS + Fastify             | 10.x       |
| ORM         | TypeORM                      | 0.3.x      |
| Auth        | JWT + Passport               | -          |
| i18n Back   | nestjs-i18n                  | 10.x       |
| Database    | MariaDB                      | 10.11      |
| E-mail      | Amazon SES                   | -          |
| Runtime     | Node.js                      | ≥18        |
| Container   | Docker Compose               | 3.8        |

### Idiomas Suportados

| Código  | Idioma     | Status       |
|---------|------------|--------------|
| `pt-BR` | Português  | ✅ Principal  |
| `en`    | English    | ✅ Secundário |
| `es`    | Español    | 🔜 Futuro     |

---

## Quick Start

### 1. Criar Estrutura do Monorepo

```bash
# Criar diretório do projeto
mkdir meu-projeto && cd meu-projeto

# Inicializar com pnpm
pnpm init

# Criar estrutura de diretórios
mkdir -p apps/web apps/api packages/ui packages/config packages/types packages/utils
mkdir -p docker docs/architecture docs/guides
```

### 2. Configurar pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3. Configurar turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 4. Package.json Raiz

```json
{
  "name": "meu-projeto",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18"
  }
}
```

---

## Frontend (apps/web)

### Package.json

```json
{
  "name": "@repo/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.50.0",
    "@tanstack/react-table": "^8.17.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "next-intl": "^3.15.0",
    "next-themes": "^0.3.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.395.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "typescript": "^5.0.0"
  }
}
```

### Instalar shadcn/ui

```bash
cd apps/web
npx shadcn-ui@latest init

# Configurações recomendadas:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Instalar componentes essenciais
npx shadcn-ui@latest add button input label card dialog dropdown-menu select toast table form
```

### components.json (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Estrutura de Diretórios Frontend

```
apps/web/
├── src/
│   ├── app/
│   │   └── [locale]/          # Rotas com locale
│   │       ├── (auth)/        # Grupo de rotas auth
│   │       ├── (dashboard)/   # Grupo de rotas dashboard
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── language-switcher.tsx
│   │   └── [feature]/         # Feature components
│   ├── hooks/
│   │   └── use-[hook].ts
│   ├── i18n/
│   │   ├── routing.ts         # Configuração de rotas i18n
│   │   └── request.ts         # Configuração de request
│   ├── messages/              # Arquivos de tradução
│   │   ├── pt-BR.json         # Português (principal)
│   │   ├── en.json            # Inglês
│   │   └── es.json            # Espanhol (futuro)
│   ├── lib/
│   │   ├── utils.ts           # cn() helper
│   │   └── api.ts             # Axios instance
│   ├── services/
│   │   └── [domain].service.ts
│   ├── stores/
│   │   └── use-[store].ts     # Zustand stores
│   └── types/
│       └── index.ts
├── public/
├── middleware.ts              # i18n middleware
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Backend (apps/api)

### Package.json

```json
{
  "name": "@repo/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "test": "jest",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "pnpm typeorm migration:generate",
    "migration:run": "pnpm typeorm migration:run -d src/database/data-source.ts",
    "migration:revert": "pnpm typeorm migration:revert -d src/database/data-source.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/platform-fastify": "^10.3.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/swagger": "^7.3.0",
    "@nestjs/throttler": "^5.1.0",
    "@fastify/helmet": "^11.1.0",
    "@fastify/compress": "^7.0.0",
    "@fastify/cors": "^9.0.0",
    "@fastify/static": "^7.0.0",
    "fastify": "^4.27.0",
    "typeorm": "^0.3.20",
    "mariadb": "^3.3.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "passport-local": "^1.0.0",
    "@nestjs-modules/mailer": "^2.0.0",
    "@aws-sdk/client-ses": "^3.550.0",
    "handlebars": "^4.7.0",
    "nestjs-i18n": "^10.4.0",
    "bcrypt": "^5.1.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
```

### Estrutura de Diretórios Backend

```
apps/api/
├── src/
│   ├── main.ts                 # Bootstrap Fastify
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── dto/
│   │   └── interfaces/
│   ├── i18n/                   # Internacionalização
│   │   ├── pt-BR/              # Português
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   └── validation.json
│   │   ├── en/                 # Inglês
│   │   │   └── ...
│   │   └── es/                 # Espanhol (futuro)
│   │       └── ...
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/              # RBAC
│   │   ├── permissions/        # RBAC
│   │   └── mail/               # Amazon SES
│   └── database/
│       ├── database.module.ts
│       ├── data-source.ts
│       ├── migrations/
│       └── seeds/
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### main.ts (Fastify Bootstrap)

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Plugins Fastify
  await app.register(require('@fastify/helmet'));
  await app.register(require('@fastify/compress'));
  await app.register(require('@fastify/cors'), {
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (dev only)
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Fastify running on http://localhost:${port}`);
}

bootstrap();
```

---

## Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # DATABASE
  # ===========================================
  mariadb:
    image: mariadb:10.11
    container_name: ${PROJECT_NAME:-app}_mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${DB_NAME:-app_db}
      MYSQL_USER: ${DB_USERNAME:-app_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:-app_pass}
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    networks:
      - app_network
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===========================================
  # REDIS (Cache - opcional)
  # ===========================================
  redis:
    image: redis:7-alpine
    container_name: ${PROJECT_NAME:-app}_redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - app_network

  # ===========================================
  # BACKEND (NestJS + Fastify)
  # ===========================================
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    container_name: ${PROJECT_NAME:-app}_api
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      PORT: 3001
      DB_HOST: mariadb
      DB_PORT: 3306
      DB_USERNAME: ${DB_USERNAME:-app_user}
      DB_PASSWORD: ${DB_PASSWORD:-app_pass}
      DB_NAME: ${DB_NAME:-app_db}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:3000}
    ports:
      - "${API_PORT:-3001}:3001"
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - app_network

  # ===========================================
  # FRONTEND (Next.js)
  # ===========================================
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    container_name: ${PROJECT_NAME:-app}_web
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
    ports:
      - "${WEB_PORT:-3000}:3000"
    depends_on:
      - api
    networks:
      - app_network

volumes:
  mariadb_data:
  redis_data:

networks:
  app_network:
    driver: bridge
```

### .env.example

```env
# ===========================================
# PROJECT
# ===========================================
PROJECT_NAME=meu-projeto
NODE_ENV=development

# ===========================================
# DATABASE (MariaDB)
# ===========================================
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=app_pass
DB_NAME=app_db
DB_ROOT_PASSWORD=root

# ===========================================
# JWT
# ===========================================
JWT_SECRET=sua-chave-secreta-muito-segura-aqui
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ===========================================
# CORS
# ===========================================
CORS_ORIGIN=http://localhost:3000

# ===========================================
# AMAZON SES
# ===========================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_EMAIL=noreply@seudominio.com

# ===========================================
# PORTS
# ===========================================
API_PORT=3001
WEB_PORT=3000
REDIS_PORT=6379

# ===========================================
# FRONTEND
# ===========================================
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Comandos Úteis

```bash
# Instalar dependências
pnpm install

# Desenvolvimento
pnpm dev

# Build
pnpm build

# Docker (desenvolvimento)
docker-compose up -d

# Docker (produção)
docker-compose -f docker-compose.prod.yml up -d

# Migrations
cd apps/api
pnpm migration:generate src/database/migrations/NomeDaMigration
pnpm migration:run

# Adicionar componente shadcn/ui
cd apps/web
npx shadcn-ui@latest add [component-name]

# Lint
pnpm lint

# Testes
pnpm test
```

---

## Checklist de Novo Projeto

- [ ] Criar estrutura do monorepo
- [ ] Configurar pnpm-workspace.yaml
- [ ] Configurar turbo.json
- [ ] Criar apps/web com Next.js
- [ ] Instalar e configurar shadcn/ui
- [ ] Configurar i18n frontend (next-intl)
- [ ] Criar arquivos de tradução (pt-BR.json, en.json)
- [ ] Criar apps/api com NestJS + Fastify
- [ ] Configurar i18n backend (nestjs-i18n)
- [ ] Configurar TypeORM e migrations
- [ ] Configurar autenticação JWT
- [ ] Configurar RBAC (roles/permissions)
- [ ] Configurar Amazon SES para e-mails
- [ ] Criar docker-compose.yml
- [ ] Criar .env a partir de .env.example
- [ ] Testar `pnpm dev`
- [ ] Testar `docker-compose up`
- [ ] Copiar documentação de `docs/architecture/`

---

## Links de Referência

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand)
- [NestJS Docs](https://docs.nestjs.com/)
- [NestJS + Fastify](https://docs.nestjs.com/techniques/performance)
- [TypeORM Docs](https://typeorm.io/)

---

**Criado em**: Fevereiro 2026
**Versão**: 1.0.0
