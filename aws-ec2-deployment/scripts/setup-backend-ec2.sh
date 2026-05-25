#!/bin/bash
# ==============================================================================
# RxPulse Backend EC2 Provisioning Script (Amazon Linux 2023)
# ==============================================================================
# Run this script with root privileges (sudo) on the Backend EC2 instance.
#
# Usage:
#   sudo ./setup-backend-ec2.sh [GIT_REPO_URL] [MONGODB_PRIVATE_IP] [INTERNAL_ALB_DNS] [JWT_SECRET]
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Log setup output
LOG_FILE="/var/log/rxpulse-backend-setup.log"
exec > >(tee -i "$LOG_FILE") 2>&1

echo "===================================================================="
echo "Starting RxPulse Backend Provisioning on $(date)"
echo "===================================================================="

# Arguments
GIT_REPO_URL="${1:-""}"
MONGODB_PRIVATE_IP="${2:-"<MONGODB_PRIVATE_IP>"}"
INTERNAL_ALB_DNS="${3:-"<INTERNAL_ALB_DNS>"}"
JWT_SECRET="${4:-"rxpulse_jwt_secret_2024_production_secure_key_change_me"}"

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
dnf module enable nodejs:18 -y || true
dnf install -y nodejs

# Verify node and npm installation
echo "[+] Node version: $(node -v)"
echo "[+] NPM version: $(npm -v)"

# 4. Install PM2 globally
echo "[+] Installing PM2 globally..."
npm install -g pm2

# 5. Create secure system user for running backend services
if ! id -u rxpulse >/dev/null 2>&1; then
  echo "[+] Creating system user 'rxpulse'..."
  useradd -r -m -s /bin/bash rxpulse
else
  echo "[+] User 'rxpulse' already exists."
fi

# 6. Create directories and set permissions
echo "[+] Creating directories..."
mkdir -p /opt/rxpulse
mkdir -p /var/log/rxpulse

# 7. Fetch application source
SRCDIR="/opt/rxpulse-src"
mkdir -p "$SRCDIR"

if [ -n "$GIT_REPO_URL" ]; then
  echo "[+] Cloning repository from $GIT_REPO_URL..."
  rm -rf "$SRCDIR"
  git clone "$GIT_REPO_URL" "$SRCDIR"
else
  echo "[!] No GIT_REPO_URL provided. Assuming source files are already copied to $SRCDIR."
  if [ ! -d "$SRCDIR/services" ]; then
    echo "[-] Error: Backend services directory not found at $SRCDIR/services."
    echo "[-] Please clone or copy the project files to $SRCDIR."
    exit 1
  fi
fi

# 8. Copy and build microservices
echo "[+] Copying services to deployment directory (/opt/rxpulse)..."
rm -rf /opt/rxpulse/*
cp -r "$SRCDIR/services/user-service" /opt/rxpulse/
cp -r "$SRCDIR/services/catalog-service" /opt/rxpulse/
cp -r "$SRCDIR/services/inventory-service" /opt/rxpulse/

# Copy ecosystem config
if [ -f "$SRCDIR/aws-ec2-deployment/backend/ecosystem.config.js" ]; then
  cp "$SRCDIR/aws-ec2-deployment/backend/ecosystem.config.js" /opt/rxpulse/
else
  echo "[-] Ecosystem config not found at template path. Creating a local one..."
  cat <<EOF > /opt/rxpulse/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'user-service',
      cwd: '/opt/rxpulse/user-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      env: { NODE_ENV: 'production', PORT: 3001 }
    },
    {
      name: 'catalog-service',
      cwd: '/opt/rxpulse/catalog-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      env: { NODE_ENV: 'production', PORT: 3002 }
    },
    {
      name: 'inventory-service',
      cwd: '/opt/rxpulse/inventory-service',
      script: './src/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '250M',
      env: { NODE_ENV: 'production', PORT: 3003 }
    }
  ]
};
EOF
fi

# Install dependencies for each service
for service in user-service catalog-service  inventory-service; do
  echo "[+] Installing production dependencies for $service..."
  cd "/opt/rxpulse/$service"
  npm ci --omit=dev
done

# 9. Configure Environment Variables
echo "[+] Setting up environment configuration files..."
ENV_SRC_DIR="$SRCDIR/aws-ec2-deployment/environment-configs"

# User Service env
if [ -f "$ENV_SRC_DIR/user-service.env" ]; then
  sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" \
      -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
      "$ENV_SRC_DIR/user-service.env" > /opt/rxpulse/user-service/.env
else
  cat <<EOF > /opt/rxpulse/user-service/.env
PORT=3001
NODE_ENV=production
MONGO_URI=mongodb://$MONGODB_PRIVATE_IP:27017/users_db
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
EOF
fi

# Catalog Service env
if [ -f "$ENV_SRC_DIR/catalog-service.env" ]; then
  sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" \
      -e "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" \
      -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
      "$ENV_SRC_DIR/catalog-service.env" > /opt/rxpulse/catalog-service/.env
else
  cat <<EOF > /opt/rxpulse/catalog-service/.env
PORT=3002
NODE_ENV=production
MONGO_URI=mongodb://$MONGODB_PRIVATE_IP:27017/catalog_db
JWT_SECRET=$JWT_SECRET
AUTH_SERVICE_URL=http://$INTERNAL_ALB_DNS
EOF
fi

# Inventory Service env
if [ -f "$ENV_SRC_DIR/inventory-service.env" ]; then
  sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" \
      -e "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" \
      -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
      "$ENV_SRC_DIR/inventory-service.env" > /opt/rxpulse/inventory-service/.env
else
  cat <<EOF > /opt/rxpulse/inventory-service/.env
PORT=3003
NODE_ENV=production
MONGO_URI=mongodb://$MONGODB_PRIVATE_IP:27017/inventory_db
JWT_SECRET=$JWT_SECRET
AUTH_SERVICE_URL=http://$INTERNAL_ALB_DNS
CATALOG_SERVICE_URL=http://$INTERNAL_ALB_DNS
EOF
fi

# 10. Fix ownership of application directories
echo "[+] Configuring directory permissions..."
chown -R rxpulse:rxpulse /opt/rxpulse
chown -R rxpulse:rxpulse /var/log/rxpulse
# Allow rxpulse user to write PM2 logs to /var/log/rxpulse
chmod -R 775 /var/log/rxpulse

# 11. Deploy Systemd service file
echo "[+] Installing systemd service..."
SYSTEMD_SRC="$SRCDIR/aws-ec2-deployment/systemd/rxpulse-backend.service"

if [ -f "$SYSTEMD_SRC" ]; then
  cp "$SYSTEMD_SRC" /etc/systemd/system/rxpulse-backend.service
else
  echo "[!] Systemd template not found. Creating inline..."
  cat <<EOF > /etc/systemd/system/rxpulse-backend.service
[Unit]
Description=RxPulse Backend Services (PM2)
After=network.target

[Service]
Type=forking
User=rxpulse
Group=rxpulse
LimitNOFILE=65536
Environment=PATH=/usr/bin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/home/rxpulse/.pm2
Environment=NODE_ENV=production
ExecStart=/usr/local/bin/pm2 resurrect
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
fi

# 12. Setup PM2 Startup Script under 'rxpulse' user
echo "[+] Starting services under 'rxpulse' user..."
# Run PM2 startup config to generate systemd startup hook for PM2
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin pm2 startup systemd -u rxpulse --hp /home/rxpulse | tail -n 1 > /tmp/pm2-startup-cmd.sh
chmod +x /tmp/pm2-startup-cmd.sh
/tmp/pm2-startup-cmd.sh || true
rm -f /tmp/pm2-startup-cmd.sh

# Run ecosystem config and save process list
echo "[+] Launching PM2 process list..."
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 start /opt/rxpulse/ecosystem.config.js
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 save

# Enable and start systemd service
echo "[+] Enabling and starting systemd service..."
systemctl daemon-reload
systemctl enable pm2-rxpulse.service || systemctl enable pm2-root.service || true
systemctl enable rxpulse-backend.service
systemctl restart rxpulse-backend.service

echo "===================================================================="
echo "[+] RxPulse Backend setup completed successfully!"
echo "    Check setup logs at: $LOG_FILE"
echo "    Check PM2 status using: sudo -u rxpulse pm2 status"
echo "===================================================================="
