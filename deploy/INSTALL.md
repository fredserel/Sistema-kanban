# Instalacao Rapida - Conectenvios

## Requisitos

- Ubuntu 22.04+ ou Debian 12+
- 2GB RAM minimo
- 20GB disco
- Dominio apontando para o servidor

## Instalacao em 3 Passos

### 1. Clonar e Entrar

```bash
git clone https://github.com/fredserel/Sistema-kanban.git /opt/conectenvios
cd /opt/conectenvios/deploy
chmod +x scripts/*.sh
```

### 2. Executar Setup

```bash
./scripts/setup.sh
```

O script ira:
- Instalar Docker (se necessario)
- Gerar senhas automaticamente (DB, JWT, Refresh Token)
- Criar containers (MariaDB, API, Web, Nginx)
- Criar permissoes e perfis iniciais

### 3. Configurar SSL

```bash
./scripts/init-ssl.sh
```

## Primeiro Acesso

Em producao, usuarios de teste **NAO** sao criados automaticamente.
Apos a instalacao, crie o primeiro administrador:

1. Acesse o banco via Docker:
```bash
docker exec -it conectenvios_mariadb mysql -u conectenvios_user -p conectenvios_db
```

2. Ou use a API diretamente para registrar o admin inicial.

**IMPORTANTE:** Use senhas fortes para o primeiro administrador!

---

## Comandos Uteis

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Ver logs da API
docker compose -f docker-compose.prod.yml logs -f api

# Backup
./scripts/backup.sh

# Atualizar
git pull && ./scripts/setup.sh --update

# Reiniciar
docker compose -f docker-compose.prod.yml restart
```

## Variaveis de Ambiente

As credenciais sao geradas automaticamente pelo `setup.sh` e salvas em `deploy/.env`.

| Variavel | Descricao |
|----------|-----------|
| `DB_ROOT_PASSWORD` | Senha root do MariaDB |
| `DB_USERNAME` | Usuario do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do banco |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `JWT_REFRESH_SECRET` | Chave secreta para refresh tokens |
| `DOMAIN` | Dominio da aplicacao |
| `CERTBOT_EMAIL` | Email para certificado SSL |

## Suporte

Documentacao completa: [README.md](README.md)
