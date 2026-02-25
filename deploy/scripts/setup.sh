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

# Verificar se Docker esta instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker nao encontrado. Instalando..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    log_warn "Docker instalado. Faca logout e login novamente, depois execute este script novamente."
    exit 1
fi

# Verificar se Docker Compose esta instalado
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose nao encontrado."
    log_info "Instale com: sudo apt install docker-compose-plugin"
    exit 1
fi

log_success "Docker e Docker Compose encontrados"

cd "$DEPLOY_DIR"

# Verificar/criar arquivo .env
if [ ! -f ".env" ]; then
    log_info "Criando arquivo .env..."

    # Gerar senhas aleatorias
    DB_ROOT_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    JWT_SEC=$(openssl rand -base64 64)
    JWT_REFRESH_SEC=$(openssl rand -base64 64)

    cat > .env << EOF
# ===========================================
# CONECTENVIOS - CONFIGURACAO DE PRODUCAO
# Gerado automaticamente em $(date)
# ===========================================

# DATABASE (MariaDB)
DB_ROOT_PASSWORD=${DB_ROOT_PASS}
DB_USERNAME=conectenvios_user
DB_PASSWORD=${DB_PASS}
DB_NAME=conectenvios_db

# JWT
JWT_SECRET=${JWT_SEC}
JWT_REFRESH_SECRET=${JWT_REFRESH_SEC}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# DOMAIN
DOMAIN=kanban.conectenvios.com.br
CERTBOT_EMAIL=ti@conectenvios.com.br
EOF

    log_success "Arquivo .env criado com senhas geradas automaticamente"
    log_warn "IMPORTANTE: Anote as senhas geradas!"
    echo ""
    echo "  DB_ROOT_PASSWORD: ${DB_ROOT_PASS}"
    echo "  DB_PASSWORD: ${DB_PASS}"
    echo ""
else
    log_info "Arquivo .env ja existe"
fi

# Carregar variaveis
source .env

# Criar diretorios necessarios
mkdir -p certbot/conf certbot/www backups
log_success "Diretorios criados"

# Verificar se e primeira instalacao ou atualizacao
if [ "$1" == "--update" ]; then
    log_info "Modo atualizacao"

    log_info "Atualizando containers..."
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d

    log_info "Aguardando API iniciar..."
    sleep 15

    log_success "Atualizacao concluida!"
else
    # Instalacao inicial
    log_info "Iniciando instalacao inicial..."

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

    # Executar seed (permissions e roles apenas - usuarios de teste sao ignorados em producao)
    log_info "Criando permissoes e perfis iniciais..."
    docker compose -f docker-compose.prod.yml exec -T api node -e "
      require('./dist/database/seeds/initial-data.seed').seedDatabase(
        require('typeorm').default
      )
    " 2>/dev/null || log_warn "Seed sera executado na primeira inicializacao da API"

    log_success "Instalacao base concluida!"

    echo ""
    log_warn "PROXIMO PASSO: Criar usuario administrador"
    echo ""
    echo "  Acesse a API e use o endpoint POST /api/v1/auth/register"
    echo "  para criar o primeiro usuario super admin."
    echo ""
    log_warn "PROXIMO PASSO: Configurar SSL"
    echo ""
    echo "  1. Certifique-se que o DNS aponta para este servidor:"
    echo "     dig $DOMAIN"
    echo ""
    echo "  2. Execute o script de SSL:"
    echo "     ./scripts/init-ssl.sh"
    echo ""
fi

# Status final
echo ""
log_info "Status dos containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
log_success "========================================"
log_success "  Setup concluido!"
log_success "========================================"
echo ""
echo "Em producao, usuarios de teste NAO sao criados."
echo "Crie o primeiro administrador via API ou acesso direto ao banco."
echo ""
