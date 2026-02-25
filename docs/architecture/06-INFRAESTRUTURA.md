# Infraestrutura e Deploy

## 1. Visão Geral

A infraestrutura utiliza **Docker** e **Docker Compose** para containerização e
orquestração local dos serviços, garantindo ambiente consistente entre desenvolvimento
e produção.

### 1.1 Arquitetura de Containers

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DOCKER COMPOSE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│   │    web          │   │      api        │   │    mariadb      │       │
│   │   (Next.js)     │   │    (NestJS)     │   │    (Database)   │       │
│   │                 │   │                 │   │                 │       │
│   │   Port: 3000    │──▶│   Port: 3001    │──▶│   Port: 3306    │       │
│   │                 │   │                 │   │                 │       │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘       │
│           │                     │                     │                  │
│           │                     │                     │                  │
│           ▼                     ▼                     ▼                  │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │                      NETWORK: app-network                    │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                          │
│   ┌─────────────────┐   ┌─────────────────┐                             │
│   │     redis       │   │    adminer      │                             │
│   │    (Cache)      │   │   (DB Admin)    │                             │
│   │   Port: 6379    │   │   Port: 8080    │                             │
│   └─────────────────┘   └─────────────────┘                             │
│                                                                          │
│   VOLUMES:                                                               │
│   • mariadb_data     - Persistência do banco                            │
│   • redis_data       - Persistência do cache                            │
│   • node_modules_*   - Cache de dependências                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Arquivos Docker

```
project-root/
├── docker/
│   ├── docker-compose.yml          # Desenvolvimento
│   ├── docker-compose.prod.yml     # Produção
│   ├── docker-compose.override.yml # Overrides locais (git ignored)
│   │
│   ├── web/
│   │   ├── Dockerfile              # Build Next.js
│   │   ├── Dockerfile.dev          # Dev com hot reload
│   │   └── nginx.conf              # Config Nginx (produção)
│   │
│   ├── api/
│   │   ├── Dockerfile              # Build NestJS
│   │   └── Dockerfile.dev          # Dev com hot reload
│   │
│   └── mariadb/
│       └── init/
│           └── 01-init.sql         # Script inicial do banco
│
├── .env.example                    # Template de variáveis
├── .env                            # Variáveis locais (git ignored)
└── .dockerignore                   # Arquivos ignorados no build
```

---

## 3. Docker Compose - Desenvolvimento

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  # ============================================
  # FRONTEND - Next.js
  # ============================================
  web:
    build:
      context: ../apps/web
      dockerfile: ../../docker/web/Dockerfile.dev
    container_name: app-web
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
    volumes:
      - ../apps/web:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - api
    networks:
      - app-network

  # ============================================
  # BACKEND - NestJS
  # ============================================
  api:
    build:
      context: ../apps/api
      dockerfile: ../../docker/api/Dockerfile.dev
    container_name: app-api
    restart: unless-stopped
    ports:
      - '3001:3001'
      - '9229:9229' # Debug port
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DB_HOST=mariadb
      - DB_PORT=3306
      - DB_USERNAME=${DB_USERNAME:-root}
      - DB_PASSWORD=${DB_PASSWORD:-root}
      - DB_NAME=${DB_NAME:-app_db}
      - JWT_SECRET=${JWT_SECRET:-dev-secret-key}
      - JWT_EXPIRES_IN=15m
      - CORS_ORIGIN=http://localhost:3000
    volumes:
      - ../apps/api:/app
      - /app/node_modules
      - /app/dist
    depends_on:
      mariadb:
        condition: service_healthy
    networks:
      - app-network

  # ============================================
  # DATABASE - MariaDB
  # ============================================
  mariadb:
    image: mariadb:10.11
    container_name: app-mariadb
    restart: unless-stopped
    ports:
      - '3306:3306'
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD:-root}
      - MYSQL_DATABASE=${DB_NAME:-app_db}
      - MYSQL_USER=${DB_USERNAME:-app_user}
      - MYSQL_PASSWORD=${DB_PASSWORD:-root}
      - TZ=America/Sao_Paulo
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./mariadb/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - app-network

  # ============================================
  # CACHE - Redis (Opcional)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - app-network

  # ============================================
  # ADMIN - Adminer (Dev only)
  # ============================================
  adminer:
    image: adminer:4
    container_name: app-adminer
    restart: unless-stopped
    ports:
      - '8080:8080'
    environment:
      - ADMINER_DEFAULT_SERVER=mariadb
      - ADMINER_DESIGN=nette
    depends_on:
      - mariadb
    networks:
      - app-network

# ============================================
# NETWORKS
# ============================================
networks:
  app-network:
    driver: bridge

# ============================================
# VOLUMES
# ============================================
volumes:
  mariadb_data:
    driver: local
  redis_data:
    driver: local
```

---

## 4. Dockerfiles

### 4.1 Frontend - Desenvolvimento

```dockerfile
# docker/web/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Instala pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY . .

# Expõe porta
EXPOSE 3000

# Comando de desenvolvimento com hot reload
CMD ["pnpm", "dev"]
```

### 4.2 Frontend - Produção

```dockerfile
# docker/web/Dockerfile
# ========================================
# STAGE 1: Dependencies
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# ========================================
# STAGE 2: Builder
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ========================================
# STAGE 3: Runner
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Permissões
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 4.3 Backend - Desenvolvimento

```dockerfile
# docker/api/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Instala pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml* ./

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY . .

# Expõe portas (app + debug)
EXPOSE 3001 9229

# Comando de desenvolvimento com hot reload e debug
CMD ["pnpm", "start:dev"]
```

### 4.4 Backend - Produção

```dockerfile
# docker/api/Dockerfile
# ========================================
# STAGE 1: Dependencies
# ========================================
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# ========================================
# STAGE 2: Builder
# ========================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build
RUN pnpm build

# Remove devDependencies
RUN pnpm prune --prod

# ========================================
# STAGE 3: Runner
# ========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Cria usuário não-root
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copia apenas o necessário
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Permissões
RUN chown -R nestjs:nestjs /app
USER nestjs

EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/main.js"]
```

---

## 5. Docker Compose - Produção

```yaml
# docker/docker-compose.prod.yml
version: '3.8'

services:
  # ============================================
  # REVERSE PROXY - Nginx
  # ============================================
  nginx:
    image: nginx:alpine
    container_name: app-nginx
    restart: always
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - web
      - api
    networks:
      - app-network

  # ============================================
  # FRONTEND
  # ============================================
  web:
    build:
      context: ../apps/web
      dockerfile: ../../docker/web/Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    container_name: app-web
    restart: always
    expose:
      - '3000'
    environment:
      - NODE_ENV=production
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  # ============================================
  # BACKEND
  # ============================================
  api:
    build:
      context: ../apps/api
      dockerfile: ../../docker/api/Dockerfile
    container_name: app-api
    restart: always
    expose:
      - '3001'
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=mariadb
      - DB_PORT=3306
      - DB_USERNAME=${DB_USERNAME}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-15m}
      - CORS_ORIGIN=${CORS_ORIGIN}
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  # ============================================
  # DATABASE
  # ============================================
  mariadb:
    image: mariadb:10.11
    container_name: app-mariadb
    restart: always
    expose:
      - '3306'
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=${DB_NAME}
      - MYSQL_USER=${DB_USERNAME}
      - MYSQL_PASSWORD=${DB_PASSWORD}
      - TZ=America/Sao_Paulo
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./mariadb/conf.d:/etc/mysql/conf.d:ro
    healthcheck:
      test: ['CMD', 'healthcheck.sh', '--connect', '--innodb_initialized']
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  # ============================================
  # CACHE
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: app-redis
    restart: always
    expose:
      - '6379'
    command: >
      redis-server
      --appendonly yes
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mariadb_data:
  redis_data:
```

---

## 6. Configuração Nginx (Produção)

```nginx
# docker/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logs
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/xml+rss text/javascript application/x-font-ttf
               font/opentype image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Upstream servers
    upstream frontend {
        server web:3000;
        keepalive 32;
    }

    upstream backend {
        server api:3001;
        keepalive 32;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    # Main server
    server {
        listen 443 ssl http2;
        server_name example.com;

        # SSL
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login rate limiting
        location /api/v1/auth/login {
            limit_req zone=login_limit burst=5 nodelay;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 'OK';
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 7. Variáveis de Ambiente

```bash
# .env.example

# ============================================
# APPLICATION
# ============================================
NODE_ENV=development
TZ=America/Sao_Paulo

# ============================================
# FRONTEND
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# ============================================
# BACKEND
# ============================================
PORT=3001
CORS_ORIGIN=http://localhost:3000

# ============================================
# DATABASE
# ============================================
DB_HOST=mariadb
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=secure_password_here
DB_NAME=app_db
DB_ROOT_PASSWORD=root_secure_password

# ============================================
# JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# REDIS (Produção)
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password
```

---

## 8. Scripts de Automação

### 8.1 Makefile

```makefile
# Makefile
.PHONY: help dev prod down logs clean migrate seed

# Variáveis
COMPOSE_DEV = docker compose -f docker/docker-compose.yml
COMPOSE_PROD = docker compose -f docker/docker-compose.prod.yml

help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# DESENVOLVIMENTO
# ============================================
dev: ## Inicia ambiente de desenvolvimento
	$(COMPOSE_DEV) up -d

dev-build: ## Build e inicia desenvolvimento
	$(COMPOSE_DEV) up -d --build

dev-logs: ## Mostra logs (desenvolvimento)
	$(COMPOSE_DEV) logs -f

dev-down: ## Para ambiente de desenvolvimento
	$(COMPOSE_DEV) down

# ============================================
# PRODUÇÃO
# ============================================
prod: ## Inicia ambiente de produção
	$(COMPOSE_PROD) up -d

prod-build: ## Build e inicia produção
	$(COMPOSE_PROD) up -d --build

prod-logs: ## Mostra logs (produção)
	$(COMPOSE_PROD) logs -f

prod-down: ## Para ambiente de produção
	$(COMPOSE_PROD) down

# ============================================
# DATABASE
# ============================================
migrate: ## Executa migrations
	$(COMPOSE_DEV) exec api pnpm migration:run

migrate-generate: ## Gera nova migration
	$(COMPOSE_DEV) exec api pnpm migration:generate --name=$(name)

migrate-revert: ## Reverte última migration
	$(COMPOSE_DEV) exec api pnpm migration:revert

seed: ## Executa seeds
	$(COMPOSE_DEV) exec api pnpm seed

# ============================================
# UTILITÁRIOS
# ============================================
shell-api: ## Acessa shell do container API
	$(COMPOSE_DEV) exec api sh

shell-web: ## Acessa shell do container Web
	$(COMPOSE_DEV) exec web sh

shell-db: ## Acessa MySQL CLI
	$(COMPOSE_DEV) exec mariadb mysql -u root -p

clean: ## Remove containers, volumes e imagens
	$(COMPOSE_DEV) down -v --rmi local
	docker system prune -f

restart: ## Reinicia todos os serviços
	$(COMPOSE_DEV) restart

status: ## Status dos containers
	$(COMPOSE_DEV) ps
```

### 8.2 Scripts NPM (Root package.json)

```json
{
  "scripts": {
    "docker:dev": "docker compose -f docker/docker-compose.yml up -d",
    "docker:dev:build": "docker compose -f docker/docker-compose.yml up -d --build",
    "docker:dev:down": "docker compose -f docker/docker-compose.yml down",
    "docker:dev:logs": "docker compose -f docker/docker-compose.yml logs -f",
    "docker:prod": "docker compose -f docker/docker-compose.prod.yml up -d",
    "docker:prod:build": "docker compose -f docker/docker-compose.prod.yml up -d --build",
    "docker:prod:down": "docker compose -f docker/docker-compose.prod.yml down",
    "docker:clean": "docker compose -f docker/docker-compose.yml down -v --rmi local && docker system prune -f"
  }
}
```

---

## 9. CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ============================================
  # LINT E TESTES
  # ============================================
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Unit tests
        run: pnpm test

  # ============================================
  # BUILD E PUSH (apenas main)
  # ============================================
  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          file: ./docker/api/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:${{ github.sha }}

      - name: Build and push Web
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          file: ./docker/web/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/web:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}

  # ============================================
  # DEPLOY (apenas main)
  # ============================================
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/app
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

---

## 10. Monitoramento e Logs

### 10.1 Healthcheck Endpoints

```typescript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database
      () => this.db.pingCheck('database'),

      // Memory (heap < 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Disk (< 90% usado)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('liveness')
  liveness() {
    return { status: 'ok' };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```

---

## 11. Checklist de Deploy

### 11.1 Pré-deploy

- [ ] Testes passando
- [ ] Build de produção funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations testadas
- [ ] Backup do banco de dados
- [ ] SSL/TLS configurado

### 11.2 Pós-deploy

- [ ] Health checks passando
- [ ] Logs sem erros
- [ ] Performance aceitável
- [ ] Monitoramento ativo
- [ ] Rollback testado

---

## Próximos Documentos

- [Comunicação](./07-COMUNICACAO.md) - Comunicação entre serviços
- [Segurança](./08-SEGURANCA.md) - Práticas de segurança

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição              |
|------------|--------|--------------|------------------------|
| 2026-02-11 | 1.0.0  | Arquiteto    | Versão inicial         |
