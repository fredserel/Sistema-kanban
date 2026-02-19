# Sistema Kanban - Conectenvios

Sistema de gestao de projetos com quadro Kanban de 6 etapas.

## Stack Tecnologica

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Backend | Node.js + Express + TypeScript + Prisma |
| Banco | MariaDB 10.11 |
| Auth | JWT + bcrypt |
| Drag & Drop | @dnd-kit |
| Deploy | Docker Compose + NGINX + Let's Encrypt |

## Funcionalidades

- Pipeline Kanban com 6 etapas
- Drag & Drop para movimentacao de projetos
- Sistema de permissoes granulares
- 4 perfis: Super Admin, Admin, Gerente, Operador
- Soft delete com lixeira
- Auditoria de acoes
- SSL automatico com Let's Encrypt

## Deploy em Producao

```bash
git clone https://github.com/fredserel/Sistema-kanban.git /opt/conectenvios
cd /opt/conectenvios/deploy
chmod +x scripts/*.sh
./scripts/setup.sh
./scripts/init-ssl.sh
```

Documentacao completa: [deploy/INSTALL.md](deploy/INSTALL.md)

## Desenvolvimento Local

```bash
# Iniciar banco MariaDB
docker-compose up -d mariadb

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usuarios Padrao

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@sistema.com | admin123 | Super Admin |
| gerente@sistema.com | gerente123 | Gerente |
| membro@sistema.com | membro123 | Operador |

## Etapas do Pipeline

1. **Nao Iniciado** - Projeto registrado
2. **Modelagem de Negocio** - Requisitos e regras
3. **Modelagem de TI** - Arquitetura tecnica
4. **Desenvolvimento** - Implementacao
5. **Homologacao** - Testes e validacao
6. **Finalizado** - Projeto concluido

## Permissoes

| Acao | Super Admin | Admin | Gerente | Operador |
|------|-------------|-------|---------|----------|
| Ver Kanban | Sim | Sim | Sim | Sim |
| Criar Projeto | Sim | Sim | Sim | Nao |
| Editar Projeto | Sim | Sim | Sim | Nao |
| Excluir Projeto | Sim | Sim | Nao | Nao |
| Mover Etapas | Sim | Sim | Sim | Nao |
| Pular Etapas | Sim | Sim | Nao | Nao |
| Gerenciar Usuarios | Sim | Sim | Nao | Nao |
| Gerenciar Perfis | Sim | Nao | Nao | Nao |

## Estrutura

```
├── backend/           # API Node.js + Express + Prisma
├── frontend/          # React + Vite + Tailwind
├── deploy/            # Docker, NGINX, scripts
│   ├── scripts/       # setup.sh, deploy.sh, backup.sh
│   ├── nginx/         # Configuracao NGINX + SSL
│   ├── INSTALL.md     # Guia rapido
│   └── README.md      # Documentacao completa
└── docker-compose.yml # Ambiente de desenvolvimento
```

## Licenca

Proprietario - Conectenvios
