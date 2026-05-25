#!/bin/bash
# ==============================================================================
# RxPulse MongoDB Production Restore Script
# ==============================================================================
# This script extracts and restores all 3 databases (users_db, catalog_db, 
# inventory_db) from a given backup tarball archive.
#
# Usage:
#   sudo ./restore.sh /path/to/rxpulse_backup_YYYYMMDD_HHMMSS.tar.gz [ADMIN_PASSWORD]
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

BACKUP_ARCHIVE=$1
DB_PASS=$2

# Configuration
TEMP_EXTRACT_DIR="/tmp/mongodb_restore_temp"
DB_HOST="127.0.0.1"
DB_PORT="27017"
DB_USER="admin"

# Verify archive argument is provided
if [ -z "$BACKUP_ARCHIVE" ]; then
    echo "[-] Error: Please specify the path to the backup archive."
    echo "    Usage: sudo ./restore.sh /path/to/rxpulse_backup_YYYYMMDD_HHMMSS.tar.gz [ADMIN_PASSWORD]"
    exit 1
fi

# Verify archive exists
if [ ! -f "$BACKUP_ARCHIVE" ]; then
    echo "[-] Error: Backup archive not found at: $BACKUP_ARCHIVE"
    exit 1
fi

echo "===================================================================="
echo "Starting MongoDB Restore on $(date)"
echo "===================================================================="

# Ensure temp extraction directory is clean
rm -rf "$TEMP_EXTRACT_DIR"
mkdir -p "$TEMP_EXTRACT_DIR"

# Extract archive
echo "[+] Extracting backup archive to temporary directory..."
tar -xzf "$BACKUP_ARCHIVE" -C "$TEMP_EXTRACT_DIR"

# Find the extracted folder containing DB dumps
# The tarball contains folders named like 'rxpulse_YYYYMMDD_HHMMSS/database_names/...'
DUMP_DIR=$(find "$TEMP_EXTRACT_DIR" -type d -name "rxpulse_*" -print -quit)

if [ -z "$DUMP_DIR" ] || [ ! -d "$DUMP_DIR" ]; then
    echo "[-] Error: Could not locate database dump folders in extracted archive."
    rm -rf "$TEMP_EXTRACT_DIR"
    exit 1
fi

echo "[+] Located dump files at: $DUMP_DIR"

# Restore each database
databases=("users_db" "catalog_db" "inventory_db")

for db in "${databases[@]}"; do
    DB_DUMP_PATH="$DUMP_DIR/$db"
    
    if [ -d "$DB_DUMP_PATH" ]; then
        echo "[+] Restoring database: $db..."
        
        if [ -n "$DB_PASS" ]; then
            mongorestore --host "$DB_HOST" --port "$DB_PORT" \
                         --username "$DB_USER" --password "$DB_PASS" \
                         --authenticationDatabase admin \
                         --db "$db" --drop "$DB_DUMP_PATH"
        else
            # Try unauthenticated if no password is provided
            mongorestore --host "$DB_HOST" --port "$DB_PORT" \
                         --db "$db" --drop "$DB_DUMP_PATH"
        fi
        echo "    Database $db restored successfully."
    else
        echo "[!] Warning: No dump directory found for database: $db. Skipping."
    fi
done

# Cleanup temporary files
echo "[+] Cleaning up temporary extraction files..."
rm -rf "$TEMP_EXTRACT_DIR"

echo "===================================================================="
echo "Restore Completed Successfully on $(date)"
echo "===================================================================="
