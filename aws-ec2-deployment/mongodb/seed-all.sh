#!/bin/bash
# ==============================================================================
# RxPulse Database Seeding Script
# ==============================================================================
# This script must be run on the Backend Application EC2 instance where the
# Node.js source code and .env files exist.
#
# It seeds the remote MongoDB instance with default administrative users,
# medicine categories, default stock inventories, alerts, and transaction records.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

echo "===================================================================="
echo "Starting RxPulse Database Seeding on $(date)"
echo "===================================================================="

# 1. Seed user-service (performed by starting app.js and letting it run momentarily)
echo "[+] Seeding user-service database..."
if [ -d "/opt/rxpulse/user-service" ]; then
  cd /opt/rxpulse/user-service
  # Running user-service for a few seconds to trigger startup seeding
  echo "    Starting user-service briefly to initialize admin..."
  NODE_ENV=production node src/app.js &
  APP_PID=$!
  sleep 5
  kill $APP_PID || true
  echo "    user-service seeded successfully."
else
  echo "[-] Error: user-service directory not found at /opt/rxpulse/user-service."
  exit 1
fi

# 2. Seed catalog-service (runs standalone seed.js script)
echo "[+] Seeding catalog-service database..."
if [ -d "/opt/rxpulse/catalog-service" ]; then
  cd /opt/rxpulse/catalog-service
  NODE_ENV=production node src/seed.js
  echo "    catalog-service seeded successfully."
else
  echo "[-] Error: catalog-service directory not found at /opt/rxpulse/catalog-service."
  exit 1
fi

# 3. Seed inventory-service (runs standalone seed.js script)
echo "[+] Seeding inventory-service database..."
if [ -d "/opt/rxpulse/inventory-service" ]; then
  cd /opt/rxpulse/inventory-service
  NODE_ENV=production node src/seed.js
  echo "    inventory-service seeded successfully."
else
  echo "[-] Error: inventory-service directory not found at /opt/rxpulse/inventory-service."
  exit 1
fi

echo "===================================================================="
echo "[+] RxPulse Database seeding completed successfully!"
echo "===================================================================="
