#!/bin/bash
set -e

# ===========================================
# CONECTENVIOS - SETUP INICIAL COMPLETO
# ===========================================
# Execute este script para configurar o sistema do zero
# Uso: ./setup.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$DEPLOY_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "========================================"
echo "  CONECTENVIOS - Setup Inicial"
echo "========================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    log_warn "Docker instalado. Faça logout e login novamente, depois execute este script novamente."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose não encontrado."
    log_info "Instale com: sudo apt install docker-compose-plugin"
    exit 1
fi

log_success "Docker e Docker Compose encontrados"

cd "$DEPLOY_DIR"

# Verificar/criar arquivo .env
if [ ! -f ".env" ]; then
    log_info "Criando arquivo .env..."

    # Gerar senhas aleatórias
    DB_ROOT_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    JWT_SECRET=$(openssl rand -base64 64)

    cat > .env << EOF
# ===========================================
# CONECTENVIOS - CONFIGURAÇÃO DE PRODUÇÃO
# Gerado automaticamente em $(date)
# ===========================================

# DATABASE (MariaDB)
DB_ROOT_PASSWORD=${DB_ROOT_PASS}
DB_USER=conectenvios_user
DB_PASSWORD=${DB_PASS}
DB_NAME=conectenvios_db

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# DOMAIN
DOMAIN=projetos.conectenvios.com.br
CERTBOT_EMAIL=ti@conectenvios.com.br
EOF

    log_success "Arquivo .env criado com senhas geradas automaticamente"
    log_warn "IMPORTANTE: Anote as senhas geradas!"
    echo ""
    echo "  DB_ROOT_PASSWORD: ${DB_ROOT_PASS}"
    echo "  DB_PASSWORD: ${DB_PASS}"
    echo ""
else
    log_info "Arquivo .env já existe"
fi

# Carregar variáveis
source .env

# Criar diretórios necessários
mkdir -p certbot/conf certbot/www backups
log_success "Diretórios criados"

# Verificar se é primeira instalação ou atualização
if [ "$1" == "--update" ]; then
    log_info "Modo atualização - pulando SSL"

    log_info "Atualizando containers..."
    docker compose -f docker-compose.prod.yml pull 2>/dev/null || true
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d

    log_info "Executando migrations..."
    sleep 10
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

    log_success "Atualização concluída!"
else
    # Instalação inicial
    log_info "Iniciando instalação inicial..."

    # Usar config sem SSL primeiro
    log_info "Configurando NGINX inicial (sem SSL)..."
    cp nginx/conf.d/default.conf.initial nginx/conf.d/default.conf

    # Build e start
    log_info "Construindo imagens Docker..."
    docker compose -f docker-compose.prod.yml build --no-cache

    log_info "Iniciando containers..."
    docker compose -f docker-compose.prod.yml up -d

    # Aguardar banco ficar pronto
    log_info "Aguardando banco de dados..."
    sleep 15

    # Executar migrations
    log_info "Executando migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

    # Executar seed
    log_info "Criando dados iniciais..."
    docker compose -f docker-compose.prod.yml exec -T backend npx tsx prisma/seed.ts

    log_success "Instalação base concluída!"

    echo ""
    log_warn "PRÓXIMO PASSO: Configurar SSL"
    echo ""
    echo "1. Certifique-se que o DNS aponta para este servidor:"
    echo "   dig $DOMAIN"
    echo ""
    echo "2. Execute o script de SSL:"
    echo "   ./scripts/init-ssl.sh"
    echo ""
fi

# Status final
echo ""
log_info "Status dos containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
log_success "========================================"
log_success "  Setup concluído!"
log_success "========================================"
echo ""
echo "Usuários padrão:"
echo "  admin@sistema.com / admin123 (Super Admin)"
echo "  gerente@sistema.com / gerente123 (Gerente)"
echo "  membro@sistema.com / membro123 (Operador)"
echo ""
echo "IMPORTANTE: Altere as senhas padrão após o primeiro login!"
echo ""
