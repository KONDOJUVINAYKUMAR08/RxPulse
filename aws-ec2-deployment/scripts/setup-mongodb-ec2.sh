#!/bin/bash
# ==============================================================================
# RxPulse MongoDB EC2 Provisioning Script (Amazon Linux 2023)
# ==============================================================================
# Run this script with root privileges (sudo) on the MongoDB EC2 instance.
#
# Usage:
#   sudo ./setup-mongodb-ec2.sh [ADMIN_PASSWORD] [USER_PASSWORD] [CATALOG_PASSWORD] [INVENTORY_PASSWORD]
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Log setup output
LOG_FILE="/var/log/rxpulse-mongodb-setup.log"
exec > >(tee -i "$LOG_FILE") 2>&1

echo "===================================================================="
echo "Starting RxPulse MongoDB Provisioning on $(date)"
echo "===================================================================="

# Arguments
ADMIN_PASSWORD="${1:-"AdminPass123!"}"
USER_PASSWORD="${2:-"UserPass123!"}"
CATALOG_PASSWORD="${3:-"CatalogPass123!"}"
INVENTORY_PASSWORD="${4:-"InventoryPass123!"}"

# Verify we are running as root
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo)."
  exit 1
fi

# 1. Update OS packages
echo "[+] Updating system packages..."
dnf update -y

# 2. Add MongoDB 6.0 repository
echo "[+] Adding MongoDB 6.0 repository..."
cat <<EOF > /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-6.0.asc
EOF

# 3. Install MongoDB-org packages
echo "[+] Installing MongoDB package..."
dnf install -y mongodb-org

# 4. Configure directory permissions
echo "[+] Creating MongoDB data directories..."
mkdir -p /var/lib/mongo
mkdir -p /var/log/mongodb
chown -R mongod:mongod /var/lib/mongo
chown -R mongod:mongod /var/log/mongodb

# 5. Get Private IP
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 || hostname -I | awk '{print $1}')
echo "[+] Detected Private IP: $PRIVATE_IP"

# 6. Setup initial temporary configuration (authorization disabled for bootstrapping)
echo "[+] Creating temporary configuration for bootstrapping..."
cat <<EOF > /etc/mongod.conf
storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1,$PRIVATE_IP

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: disabled
EOF

# 7. Start MongoDB
echo "[+] Starting MongoDB service for bootstrapping..."
systemctl daemon-reload
systemctl enable mongod
systemctl restart mongod

# Wait for MongoDB to be ready
echo "[+] Waiting for MongoDB to start..."
until mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
    sleep 2
    echo -n "."
done
echo " Ready!"

# 8. Create databases, collections, and application users
echo "[+] Initializing administrative and application users..."
mongosh <<EOF
// Create Root Admin in admin database
use admin
db.createUser({
  user: "admin",
  pwd: "$ADMIN_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})

// Create user-service user & DB
use users_db
db.createUser({
  user: "user_service_user",
  pwd: "$USER_PASSWORD",
  roles: [ { role: "readWrite", db: "users_db" } ]
})
db.createCollection("users")

// Create catalog-service user & DB
use catalog_db
db.createUser({
  user: "catalog_service_user",
  pwd: "$CATALOG_PASSWORD",
  roles: [ { role: "readWrite", db: "catalog_db" } ]
})
db.createCollection("categories")
db.createCollection("medicines")

// Create inventory-service user & DB
use inventory_db
db.createUser({
  user: "inventory_service_user",
  pwd: "$INVENTORY_PASSWORD",
  roles: [ { role: "readWrite", db: "inventory_db" } ]
})
db.createCollection("stocks")
db.createCollection("movements")
db.createCollection("alerts")
EOF

echo "[+] Database and users initialized."

# 9. Configure Keyfile for security (used for replica sets / authorization validation)
echo "[+] Creating security keyfile..."
openssl rand -base64 756 > /var/lib/mongo/rxpulse-keyfile
chmod 400 /var/lib/mongo/rxpulse-keyfile
chown mongod:mongod /var/lib/mongo/rxpulse-keyfile

# 10. Write final production configuration with authorization enabled
echo "[+] Creating final production NGINX config..."
cat <<EOF > /etc/mongod.conf
# mongod.conf - Production Config
storage:
  dbPath: /var/lib/mongo
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1,$PRIVATE_IP

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
  keyFile: /var/lib/mongo/rxpulse-keyfile
EOF

# 11. Restart MongoDB with authorization enabled
echo "[+] Restarting MongoDB with authorization enabled..."
systemctl restart mongod

# Verify connection with admin user
echo "[+] Verifying secure admin connection..."
mongosh --host 127.0.0.1 -u admin -p "$ADMIN_PASSWORD" --authenticationDatabase admin --eval "db.adminCommand('ping')"

echo "===================================================================="
echo "[+] RxPulse MongoDB setup completed successfully!"
echo "    Check logs at: $LOG_FILE"
echo "===================================================================="
