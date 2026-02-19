#!/bin/bash
set -e

# ===========================================
# CONECTENVIOS - RESTORE SCRIPT
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
source "$DEPLOY_DIR/.env"

BACKUP_DIR="$DEPLOY_DIR/backups"

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

# Check if backup file is provided
if [ -z "$1" ]; then
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    log_error "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ] && [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Use full path if relative
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
else
    BACKUP_PATH="$BACKUP_FILE"
fi

log_warn "WARNING: This will OVERWRITE all current data!"
read -p "Are you sure you want to restore from $BACKUP_FILE? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Restore cancelled"
    exit 0
fi

cd "$DEPLOY_DIR"

log_info "Stopping backend to prevent connections..."
docker-compose -f docker-compose.prod.yml stop backend

log_info "Restoring database from $BACKUP_FILE..."

# Drop and recreate database
docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore from backup
gunzip -c "$BACKUP_PATH" | docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$DB_USER" -d "$DB_NAME"

log_info "Starting backend..."
docker-compose -f docker-compose.prod.yml start backend

log_success "Database restored successfully from $BACKUP_FILE!"
