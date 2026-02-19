#!/bin/bash
set -e

# ===========================================
# CONECTENVIOS - SSL INITIALIZATION
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

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
    log_error ".env file not found"
    exit 1
fi

source "$DEPLOY_DIR/.env"

DOMAIN=${DOMAIN:-kanban.conectenvios.com.br}
EMAIL=${CERTBOT_EMAIL:-ti@conectenvios.com.br}

cd "$DEPLOY_DIR"

log_info "Initializing SSL for $DOMAIN..."

# Create required directories
mkdir -p certbot/conf certbot/www

# Use initial nginx config (without SSL)
log_info "Setting up initial nginx config (without SSL)..."
cp nginx/conf.d/default.conf.initial nginx/conf.d/default.conf

# Start nginx and backend (needed for ACME challenge)
log_info "Starting services for ACME challenge..."
docker-compose -f docker-compose.prod.yml up -d postgres backend frontend nginx

# Wait for services
sleep 10

# Request certificate
log_info "Requesting SSL certificate from Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# Check if certificate was created
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    log_success "SSL certificate obtained successfully!"

    # Replace nginx config with SSL version
    log_info "Enabling SSL configuration..."
    cat > nginx/conf.d/default.conf << 'NGINX_SSL_CONFIG'
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name kanban.conectenvios.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kanban.conectenvios.com.br;

    ssl_certificate /etc/letsencrypt/live/kanban.conectenvios.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kanban.conectenvios.com.br/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000" always;

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend:80;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_SSL_CONFIG

    # Reload nginx with new config
    log_info "Reloading nginx with SSL configuration..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

    log_success "SSL setup completed successfully!"
    log_info "Application is now available at: https://$DOMAIN"
else
    log_error "Failed to obtain SSL certificate"
    exit 1
fi
