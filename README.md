# Sistema de Gestao de Projetos Kanban

Sistema de gerenciamento de projetos com quadro Kanban, desenvolvido com React + TypeScript + Node.js + PostgreSQL.

## Stack Tecnologica

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticacao:** JWT + bcrypt
- **UI Components:** Tailwind CSS + shadcn/ui
- **Drag & Drop:** @dnd-kit

## Pre-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Docker)
- npm ou yarn

## Configuracao

### 1. Banco de Dados

#### Opcao A: Usando Docker (Recomendado)

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso criara um container PostgreSQL com as configuracoes corretas.

#### Opcao B: PostgreSQL Local

1. **Windows:** Baixe e instale o PostgreSQL de https://www.postgresql.org/download/windows/

2. **Criar o banco de dados:**
```sql
CREATE DATABASE kanban_db;
```

3. **Configurar o arquivo .env:**
Edite `backend/.env` com suas credenciais:
```
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/kanban_db?schema=public"
```

#### Opcao C: Servico Online (Neon, Supabase, etc)

1. Crie uma conta em https://neon.tech ou https://supabase.com
2. Crie um novo projeto/banco de dados
3. Copie a connection string e atualize o `backend/.env`

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variaveis de ambiente
# Edite o arquivo .env com suas configuracoes de banco

# Gerar cliente Prisma
npx prisma generate

# Rodar migrations
npx prisma migrate dev

# Criar usuarios iniciais
npm run prisma:seed

# Iniciar servidor de desenvolvimento
npm run dev
```

O servidor rodara em `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend rodara em `http://localhost:5173`.

## Usuarios de Teste

Apos rodar o seed, os seguintes usuarios estarao disponiveis:

| Email | Senha | Papel |
|-------|-------|-------|
| admin@sistema.com | admin123 | ADMIN |
| gerente@sistema.com | gerente123 | MANAGER |
| membro@sistema.com | membro123 | MEMBER |

## Funcionalidades

### Quadro Kanban
- 6 colunas fixas representando as etapas do projeto
- Drag and drop para mover projetos entre etapas
- Filtros por responsavel, prioridade e projetos atrasados
- Indicadores visuais de atraso (borda vermelha) e bloqueio (borda amarela)

### Gestao de Projetos
- Criar projetos com cronograma planejado para todas as 6 etapas
- Visualizar detalhes do projeto clicando no card
- Concluir, bloquear e desbloquear etapas
- Adicionar comentarios

### Regras de Negocio
- Etapas devem ser concluidas em ordem sequencial
- Retornar a uma etapa anterior exige justificativa
- Pular etapas so e permitido para ADMIN com justificativa
- Bloquear uma etapa exige motivo
- Todas as acoes sao registradas no log de auditoria

### Permissoes por Papel

| Acao | ADMIN | MANAGER | MEMBER |
|------|-------|---------|--------|
| Ver Kanban | Sim | Sim | Sim |
| Criar Projeto | Sim | Sim | Nao |
| Editar Projeto | Sim | Sim | Nao |
| Excluir Projeto | Sim | Nao | Nao |
| Mover Etapas | Sim | Sim | Nao |
| Pular Etapas | Sim | Nao | Nao |
| Gerenciar Usuarios | Sim | Nao | Nao |
| Adicionar Comentarios | Sim | Sim | Sim |

## Estrutura de Etapas

1. **Nao Iniciado** - Projeto registrado, aguardando inicio
2. **Modelagem de Negocio** - Levantamento de requisitos e regras de negocio
3. **Modelagem de TI** - Arquitetura tecnica e especificacoes
4. **Desenvolvimento** - Implementacao do projeto
5. **Homologacao** - Testes e validacao
6. **Finalizado** - Projeto concluido

## API Endpoints

### Autenticacao
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar usuario (ADMIN)
- `GET /api/auth/me` - Dados do usuario logado

### Projetos
- `GET /api/projects` - Listar projetos
- `GET /api/projects/:id` - Detalhes do projeto
- `POST /api/projects` - Criar projeto
- `PUT /api/projects/:id` - Editar projeto
- `DELETE /api/projects/:id` - Excluir projeto
- `POST /api/projects/:id/members` - Adicionar membro
- `DELETE /api/projects/:id/members/:userId` - Remover membro
- `POST /api/projects/:id/move` - Mover projeto para outra etapa
- `POST /api/projects/:id/comments` - Adicionar comentario

### Etapas
- `GET /api/projects/:id/stages` - Listar etapas do projeto
- `PUT /api/stages/:id` - Atualizar etapa
- `POST /api/stages/:id/complete` - Concluir etapa
- `POST /api/stages/:id/block` - Bloquear etapa
- `POST /api/stages/:id/unblock` - Desbloquear etapa

### Usuarios
- `GET /api/users` - Listar usuarios

## Scripts Disponiveis

### Backend
```bash
npm run dev        # Desenvolvimento com hot-reload
npm run build      # Build para producao
npm run start      # Iniciar build de producao
npm run prisma:migrate  # Rodar migrations
npm run prisma:seed     # Popular banco com dados iniciais
```

### Frontend
```bash
npm run dev        # Desenvolvimento com hot-reload
npm run build      # Build para producao
npm run preview    # Preview do build
```
