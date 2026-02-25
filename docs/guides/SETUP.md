# Guia de Configuração Inicial

## Pré-requisitos

### Software Necessário

| Software    | Versão Mínima | Verificar Instalação |
|-------------|---------------|----------------------|
| Node.js     | 18.x          | `node -v`            |
| pnpm        | 8.x           | `pnpm -v`            |
| Docker      | 24.x          | `docker -v`          |
| Docker Compose | 2.x        | `docker compose version` |
| Git         | 2.x           | `git --version`      |

### Instalação dos Pré-requisitos

#### Node.js (via nvm)

```bash
# Windows (nvm-windows)
# Download: https://github.com/coreybutler/nvm-windows/releases

# Linux/macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

#### pnpm

```bash
# Via npm
npm install -g pnpm

# Via corepack (Node 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

#### Docker Desktop

- **Windows/macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

---

## 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/seu-projeto.git
cd seu-projeto
```

---

## 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar variáveis (opcional para desenvolvimento)
# As variáveis padrão funcionam para ambiente local
```

### Variáveis Principais

```bash
# .env

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=app_db

# JWT
JWT_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=15m

# API
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 3. Instalar Dependências

```bash
# Na raiz do projeto (instala todas as dependências do monorepo)
pnpm install
```

---

## 4. Iniciar Serviços com Docker

### Opção A: Apenas Database + Redis (Recomendado para Dev)

```bash
# Inicia apenas os serviços de infraestrutura
docker compose -f docker/docker-compose.yml up -d mariadb redis adminer
```

### Opção B: Ambiente Completo com Docker

```bash
# Inicia todos os serviços (web, api, mariadb, redis)
docker compose -f docker/docker-compose.yml up -d
```

### Verificar Status

```bash
docker compose -f docker/docker-compose.yml ps
```

---

## 5. Executar Migrations

```bash
# Executa migrations do banco de dados
pnpm --filter api migration:run
```

---

## 6. Executar Seeds (Opcional)

```bash
# Popula o banco com dados iniciais
pnpm --filter api seed
```

---

## 7. Iniciar Aplicação (Desenvolvimento)

### Opção A: Turborepo (Recomendado)

```bash
# Inicia frontend e backend simultaneamente
pnpm dev
```

### Opção B: Separadamente

```bash
# Terminal 1 - Backend
pnpm --filter api dev

# Terminal 2 - Frontend
pnpm --filter web dev
```

---

## 8. Verificar Instalação

### URLs de Acesso

| Serviço     | URL                           |
|-------------|-------------------------------|
| Frontend    | http://localhost:3000         |
| Backend API | http://localhost:3001/api/v1  |
| Swagger     | http://localhost:3001/api/docs |
| Adminer     | http://localhost:8080         |

### Health Check

```bash
# Backend
curl http://localhost:3001/api/v1/health

# Deve retornar:
# {"status":"ok","info":{"database":{"status":"up"}}}
```

---

## Troubleshooting

### Erro: Port already in use

```bash
# Verificar processos usando a porta
# Windows
netstat -ano | findstr :3000

# Linux/macOS
lsof -i :3000

# Matar processo
# Windows
taskkill /PID <PID> /F

# Linux/macOS
kill -9 <PID>
```

### Erro: Database connection refused

```bash
# Verificar se container está rodando
docker compose -f docker/docker-compose.yml ps mariadb

# Verificar logs
docker compose -f docker/docker-compose.yml logs mariadb

# Reiniciar container
docker compose -f docker/docker-compose.yml restart mariadb
```

### Erro: pnpm install falha

```bash
# Limpar cache do pnpm
pnpm store prune

# Remover node_modules e reinstalar
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Erro: Migration falha

```bash
# Verificar se banco está acessível
docker compose -f docker/docker-compose.yml exec mariadb mysql -uroot -proot -e "SHOW DATABASES;"

# Reverter última migration
pnpm --filter api migration:revert

# Executar novamente
pnpm --filter api migration:run
```

---

## Comandos Úteis

```bash
# Turborepo
pnpm dev          # Inicia desenvolvimento
pnpm build        # Build de produção
pnpm lint         # Executa linting
pnpm test         # Executa testes
pnpm type-check   # Verifica tipos TypeScript

# Docker
docker compose -f docker/docker-compose.yml up -d      # Inicia
docker compose -f docker/docker-compose.yml down       # Para
docker compose -f docker/docker-compose.yml logs -f    # Logs
docker compose -f docker/docker-compose.yml restart    # Reinicia

# Database
pnpm --filter api migration:run       # Executa migrations
pnpm --filter api migration:revert    # Reverte última
pnpm --filter api migration:generate --name=NomeDaMigration

# Workspace específico
pnpm --filter web <comando>    # Frontend
pnpm --filter api <comando>    # Backend
pnpm --filter @repo/ui <comando>  # Package UI
```

---

## Próximos Passos

- [Guia de Desenvolvimento](./DEVELOPMENT.md)
- [Guia de Deploy](./DEPLOYMENT.md)
- [Documentação de Arquitetura](../architecture/README.md)
