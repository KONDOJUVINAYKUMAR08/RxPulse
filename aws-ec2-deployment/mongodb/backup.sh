#!/bin/bash
# ==============================================================================
# RxPulse MongoDB Production Backup Script
# ==============================================================================
# This script dumps all 3 databases (users_db, catalog_db, inventory_db) with
# credentials, compresses them, and stores them in a timestamped folder.
# It includes local retention policy and optional upload to Amazon S3.
#
# Configure this script as a daily cron job.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
S3_BUCKET="" # Enter S3 bucket name here (e.g., "s3://rxpulse-backups-bucket")

# Credentials (replace with actual db user details if auth is enabled)
DB_USER="admin"
DB_PASS="<MONGODB_ADMIN_PASSWORD>"
DB_HOST="127.0.0.1"
DB_PORT="27017"

echo "===================================================================="
echo "Starting MongoDB Backup on $(date)"
echo "===================================================================="

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Target backup directory for this run
RUN_BACKUP_DIR="$BACKUP_DIR/rxpulse_$DATE"
mkdir -p "$RUN_BACKUP_DIR"

# Perform mongodump for all databases
echo "[+] Dumping databases..."

# Array of databases to back up
databases=("users_db" "catalog_db" "inventory_db")

for db in "${databases[@]}"; do
    echo "    Backing up database: $db..."
    if [ -n "$DB_PASS" ] && [ "$DB_PASS" != "<MONGODB_ADMIN_PASSWORD>" ]; then
        mongodump --host "$DB_HOST" --port "$DB_PORT" \
                  --username "$DB_USER" --password "$DB_PASS" \
                  --authenticationDatabase admin \
                  --db "$db" --out "$RUN_BACKUP_DIR"
    else
        # Fallback to local socket dump if password is not configured in script
        mongodump --host "$DB_HOST" --port "$DB_PORT" \
                  --db "$db" --out "$RUN_BACKUP_DIR"
    fi
done

# Compress backup
echo "[+] Compressing backup into tarball..."
tar -czf "$BACKUP_DIR/rxpulse_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "rxpulse_$DATE"
rm -rf "$RUN_BACKUP_DIR"

echo "[+] Backup created: $BACKUP_DIR/rxpulse_backup_$DATE.tar.gz"

# Optional S3 Upload
if [ -n "$S3_BUCKET" ]; then
    if command -v aws >/dev/null 2>&1; then
        echo "[+] Uploading backup to S3 ($S3_BUCKET)..."
        aws s3 cp "$BACKUP_DIR/rxpulse_backup_$DATE.tar.gz" "$S3_BUCKET/rxpulse_backup_$DATE.tar.gz"
        echo "[+] Upload to S3 completed."
    else
        echo "[!] Warning: AWS CLI is not installed. Skipping S3 upload."
    fi
fi

# Clean up old backups (Local Retention Policy)
echo "[+] Purging local backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -name "rxpulse_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[+] Purge completed."

echo "===================================================================="
echo "Backup Completed Successfully on $(date)"
echo "===================================================================="
