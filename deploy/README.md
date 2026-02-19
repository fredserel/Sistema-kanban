# Conectenvios - Guia de Deploy em Produção

## Requisitos do Servidor

- **Sistema Operacional**: Ubuntu 22.04 LTS ou superior
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **Disco**: Mínimo 20GB
- **Portas abertas**: 80, 443

## Configuração do DNS

Configure o registro DNS do domínio:

```
Tipo: A
Nome: projetos
Valor: <IP_DO_SERVIDOR>
TTL: 300
```

## Instalação

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Reiniciar para aplicar grupo docker
sudo reboot
```

### 2. Clonar o Repositório

```bash
cd /opt
sudo git clone <URL_DO_REPOSITORIO> conectenvios
sudo chown -R $USER:$USER conectenvios
cd conectenvios/deploy
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env

# Editar com suas configurações
nano .env
```

**Variáveis obrigatórias:**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DB_USER` | Usuário do PostgreSQL | `conectenvios_user` |
| `DB_PASSWORD` | Senha do banco (forte!) | `SuaSenhaForte123!@#` |
| `DB_NAME` | Nome do banco | `conectenvios_db` |
| `JWT_SECRET` | Chave secreta JWT (64 chars) | Use: `openssl rand -base64 64` |
| `DOMAIN` | Domínio da aplicação | `kanban.conectenvios.com.br` |
| `CERTBOT_EMAIL` | Email para Let's Encrypt | `ti@conectenvios.com.br` |

### 4. Primeiro Deploy (com SSL)

```bash
# Dar permissão aos scripts
chmod +x scripts/*.sh

# Inicializar SSL e subir aplicação
./scripts/init-ssl.sh

# Executar seed inicial (apenas na primeira vez)
./scripts/deploy.sh --seed
```

### 5. Verificar Status

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## Atualizações

Para atualizar a aplicação:

```bash
cd /opt/conectenvios/deploy
./scripts/deploy.sh
```

## Backup e Restauração

### Criar Backup

```bash
./scripts/backup.sh
```

Os backups são salvos em `deploy/backups/` com retenção de 30 dias.

### Restaurar Backup

```bash
# Listar backups disponíveis
./scripts/restore.sh

# Restaurar um backup específico
./scripts/restore.sh backup_20240101_120000.sql.gz
```

### Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 3h
0 3 * * * /opt/conectenvios/deploy/scripts/backup.sh >> /var/log/conectenvios-backup.log 2>&1
```

## Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.prod.yml logs -f backend

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Executar comando no container
docker-compose -f docker-compose.prod.yml exec backend sh

# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps
```

## Estrutura de Arquivos

```
deploy/
├── docker-compose.prod.yml    # Configuração principal
├── .env                       # Variáveis de ambiente (não commitado)
├── .env.production.example    # Exemplo de configuração
├── Dockerfile.backend         # Build do backend
├── Dockerfile.frontend        # Build do frontend
├── nginx/
│   ├── nginx.conf             # Configuração principal do NGINX
│   └── conf.d/
│       ├── default.conf       # Virtual host com SSL
│       └── default.conf.initial # Config inicial (sem SSL)
├── certbot/
│   ├── conf/                  # Certificados SSL
│   └── www/                   # Challenge ACME
├── backups/                   # Backups do banco
└── scripts/
    ├── deploy.sh              # Script de deploy
    ├── init-ssl.sh            # Inicialização SSL
    ├── backup.sh              # Backup do banco
    └── restore.sh             # Restauração do banco
```

## Renovação do Certificado SSL

O certificado é renovado automaticamente pelo container `certbot`. Para renovar manualmente:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot renew
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs backend

# Verificar se o banco está healthy
docker-compose -f docker-compose.prod.yml ps postgres
```

### Erro de conexão com banco

```bash
# Verificar se o postgres está rodando
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Testar conexão
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push
```

### Certificado SSL não funciona

```bash
# Verificar se o domínio resolve para o IP correto
dig kanban.conectenvios.com.br

# Verificar certificados
ls -la certbot/conf/live/kanban.conectenvios.com.br/

# Re-gerar certificado
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    -d kanban.conectenvios.com.br
```

## Suporte

Em caso de problemas, verifique:
1. Logs dos containers
2. Status do DNS
3. Firewall/portas abertas
4. Espaço em disco

---

**Conectenvios** - Sistema de Gestão de Projetos
