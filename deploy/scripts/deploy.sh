#!/bin/bash
set -e

# ===========================================
# CONECTENVIOS - DEPLOY SCRIPT
# ===========================================

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

# Check if .env exists
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    log_error ".env file not found in $DEPLOY_DIR"
    log_info "Run ./scripts/setup.sh first"
    exit 1
fi

# Load environment variables
source "$DEPLOY_DIR/.env"

log_info "Starting deployment for $DOMAIN..."

cd "$DEPLOY_DIR"

# Pull latest changes
log_info "Pulling latest changes from git..."
cd "$PROJECT_DIR"
git pull origin master

cd "$DEPLOY_DIR"

# Build and start containers
log_info "Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

log_info "Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
log_info "Waiting for services to be healthy..."
sleep 15

# Check services status
log_info "Checking services status..."
docker compose -f docker-compose.prod.yml ps

log_success "Deployment completed successfully!"
log_info "Application is available at: https://$DOMAIN"
