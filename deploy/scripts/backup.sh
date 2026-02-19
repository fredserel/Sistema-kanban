#!/bin/bash
set -e

# ===========================================
# CONECTENVIOS - BACKUP SCRIPT
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
source "$DEPLOY_DIR/.env"

# Backup configuration
BACKUP_DIR="$DEPLOY_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

cd "$DEPLOY_DIR"

log_info "Starting database backup..."

# Create backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(ls -lh "$BACKUP_DIR/$BACKUP_FILE" | awk '{print $5}')

log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Remove old backups
log_info "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
log_info "Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"

log_success "Backup process completed!"
