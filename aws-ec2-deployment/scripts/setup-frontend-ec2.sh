#!/bin/bash
# ==============================================================================
# RxPulse Frontend EC2 Provisioning Script (Amazon Linux 2023)
# ==============================================================================
# Run this script with root privileges (sudo) on the Frontend EC2 instance.
#
# Usage:
#   sudo ./setup-frontend-ec2.sh [GIT_REPO_URL] [INTERNAL_ALB_DNS]
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Log setup output
LOG_FILE="/var/log/rxpulse-frontend-setup.log"
exec > >(tee -i "$LOG_FILE") 2>&1

echo "===================================================================="
echo "Starting RxPulse Frontend Provisioning on $(date)"
echo "===================================================================="

# Arguments
GIT_REPO_URL="${1:-""}"
INTERNAL_ALB_DNS="${2:-"<INTERNAL_ALB_DNS>"}"

# Verify we are running as root
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo)."
  exit 1
fi

# 1. Update OS packages
echo "[+] Updating system packages..."
dnf update -y

# 2. Install Git and build dependencies
echo "[+] Installing git, development tools, and utility packages..."
dnf install -y git make gcc-c++

# 3. Install Node.js 18 LTS
echo "[+] Installing Node.js 18..."
# On Amazon Linux 2023, Node.js 18 is available in the default repositories
dnf module enable nodejs:18 -y || true
dnf install -y nodejs

# Verify node and npm installation
echo "[+] Node version: $(node -v)"
echo "[+] NPM version: $(npm -v)"

# 4. Install NGINX
echo "[+] Installing NGINX..."
dnf install -y nginx

# 5. Create directories
echo "[+] Setting up web directory structure..."
mkdir -p /var/www/rxpulse/html
chown -R nginx:nginx /var/www/rxpulse

# 6. Fetch application source
SRCDIR="/opt/rxpulse-src"
mkdir -p "$SRCDIR"

if [ -n "$GIT_REPO_URL" ]; then
  echo "[+] Cloning repository from $GIT_REPO_URL..."
  rm -rf "$SRCDIR"
  git clone "$GIT_REPO_URL" "$SRCDIR"
else
  echo "[!] No GIT_REPO_URL provided. Assuming source files are already copied to $SRCDIR."
  if [ ! -d "$SRCDIR/frontend" ]; then
    echo "[-] Error: Frontend source directory not found at $SRCDIR/frontend."
    echo "[-] Please clone or copy the project files to $SRCDIR."
    exit 1
  fi
fi

# 7. Build Frontend Application
echo "[+] Building frontend application..."
cd "$SRCDIR/frontend"

# Clean install dependencies
npm ci

# Build the Vite application
echo "[+] Running npm run build..."
npm run build

# Copy build files to NGINX web root
echo "[+] Copying build artifact to /var/www/rxpulse/html..."
rm -rf /var/www/rxpulse/html/*
cp -r dist/* /var/www/rxpulse/html/
chown -R nginx:nginx /var/www/rxpulse/html

# 8. Configure NGINX
echo "[+] Configuring NGINX..."
CONF_SOURCE="$SRCDIR/aws-ec2-deployment/frontend/nginx/rxpulse.conf"

if [ -f "$CONF_SOURCE" ]; then
  echo "[+] Found NGINX configuration template at $CONF_SOURCE"
  # Replace internal ALB placeholder
  sed "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" "$CONF_SOURCE" > /etc/nginx/conf.d/rxpulse.conf
else
  echo "[!] NGINX config template not found at $CONF_SOURCE, creating inline..."
  cat <<EOF > /etc/nginx/conf.d/rxpulse.conf
server {
    listen 80;
    server_name _;

    root /var/www/rxpulse/html;
    index index.html;

    location /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'OK';
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/users/ {
        proxy_pass http://$INTERNAL_ALB_DNS/api/users/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /api/catalog/ {
        proxy_pass http://$INTERNAL_ALB_DNS/api/catalog/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /api/inventory/ {
        proxy_pass http://$INTERNAL_ALB_DNS/api/inventory/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|json)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform, immutable";
        access_log off;
    }
}
EOF
fi

# Ensure default server is disabled or managed to avoid conflicts on port 80
# Commenting out default server blocks in main nginx.conf if present
sed -i 's/listen       80 default_server;/listen       80;/g' /etc/nginx/nginx.conf || true

# 9. Verify and Start NGINX
echo "[+] Validating NGINX configuration..."
nginx -t

echo "[+] Starting and enabling NGINX service..."
systemctl daemon-reload
systemctl enable nginx
systemctl restart nginx

echo "===================================================================="
echo "[+] RxPulse Frontend setup completed successfully!"
echo "    Check logs at: $LOG_FILE"
echo "===================================================================="
