#!/bin/bash
# ==============================================================================
# RxPulse MongoDB Core Setup and User Initialization
# ==============================================================================
# This script initializes MongoDB configurations, user accounts, and directories.
# Run on the MongoDB server after installation or let setup-mongodb-ec2.sh call it.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Arguments
ADMIN_PASSWORD="${1:-"AdminPass123!"}"
USER_PASSWORD="${2:-"UserPass123!"}"
CATALOG_PASSWORD="${3:-"CatalogPass123!"}"
INVENTORY_PASSWORD="${4:-"InventoryPass123!"}"

echo "[+] Creating MongoDB database directories..."
mkdir -p /var/lib/mongo
mkdir -p /var/log/mongodb
chown -R mongod:mongod /var/lib/mongo
chown -R mongod:mongod /var/log/mongodb

echo "[+] Creating admin and database microservice users..."
mongosh <<EOF
// Admin DB Users
use admin
db.createUser({
  user: "admin",
  pwd: "$ADMIN_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})

// User Service DB Users
use users_db
db.createUser({
  user: "user_service_user",
  pwd: "$USER_PASSWORD",
  roles: [ { role: "readWrite", db: "users_db" } ]
})

// Catalog Service DB Users
use catalog_db
db.createUser({
  user: "catalog_service_user",
  pwd: "$CATALOG_PASSWORD",
  roles: [ { role: "readWrite", db: "catalog_db" } ]
})

// Inventory Service DB Users
use inventory_db
db.createUser({
  user: "inventory_service_user",
  pwd: "$INVENTORY_PASSWORD",
  roles: [ { role: "readWrite", db: "inventory_db" } ]
})
EOF

echo "[+] MongoDB users initialized."
