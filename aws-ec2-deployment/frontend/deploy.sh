#!/bin/bash
# ==============================================================================
# RxPulse Frontend Application Deployment & Update Script
# ==============================================================================
# Run this script from your local development machine or a CI/CD runner to
# build and deploy frontend updates to the private NGINX EC2 instances.
#
# It compiles the React application locally, packages the build, and copies it
# to the remote servers using SSH Jump via the Bastion Host.
#
# Usage:
#   ./deploy.sh <BASTION_IP> <WEB_SERVER_1_IP> [WEB_SERVER_2_IP] ...
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
SSH_KEY_PATH="~/.ssh/rxpulse-admin-key.pem"
REMOTE_USER="ec2-user"
LOCAL_FRONTEND_DIR="../../frontend" # Relative to this script's directory
TARBALL_NAME="rxpulse-frontend-build.tar.gz"
REMOTE_TMP_DIR="/tmp"
WEB_ROOT="/var/www/rxpulse/html"

BASTION_IP=$1
shift
WEB_SERVERS=("$@")

# Validation
if [ -z "$BASTION_IP" ] || [ ${#WEB_SERVERS[@]} -eq 0 ]; then
    echo "[-] Error: Missing arguments."
    echo "    Usage: ./deploy.sh <BASTION_IP> <WEB_SERVER_1_IP> [WEB_SERVER_2_IP] ..."
    exit 1
fi

echo "===================================================================="
echo "Starting RxPulse Frontend Build & Deploy Process on $(date)"
echo "===================================================================="

# 1. Compile React Build Locally
echo "[+] Navigating to frontend directory and executing build..."
cd "$(dirname "$0")/$LOCAL_FRONTEND_DIR"

if [ ! -f "package.json" ]; then
    echo "[-] Error: package.json not found in $LOCAL_FRONTEND_DIR. Ensure the path is correct."
    exit 1
fi

echo "    Installing packages locally..."
npm ci

echo "    Compiling Vite production assets..."
npm run build

# 2. Package assets
echo "[+] Packaging build folder..."
cd dist
tar -czf "../$TARBALL_NAME" *
cd ..

echo "[+] Build packaged successfully: $TARBALL_NAME ($(du -sh $TARBALL_NAME | cut -f1))"

# 3. Deploy to each target web server via Bastion
for server_ip in "${WEB_SERVERS[@]}"; do
    echo "--------------------------------------------------------------------"
    echo "[+] Deploying update to Web Server: $server_ip"
    echo "--------------------------------------------------------------------"
    
    # Define SSH connection parameters to route traffic through Bastion jump box
    SSH_OPTS="-o StrictHostKeyChecking=no -o ProxyCommand=\"ssh -i $SSH_KEY_PATH -W %h:%p $REMOTE_USER@$BASTION_IP\""

    # Upload tarball to private EC2 temp directory
    echo "    Uploading tarball package..."
    scp -i "$SSH_KEY_PATH" $SSH_OPTS "$TARBALL_NAME" "$REMOTE_USER@$server_ip:$REMOTE_TMP_DIR/"
    
    # Log in and update the NGINX folder
    echo "    Extracting and updating web assets on remote server..."
    ssh -i "$SSH_KEY_PATH" $SSH_OPTS "$REMOTE_USER@$server_ip" <<EOF
        set -e
        # Backup existing build
        if [ -d "$WEB_ROOT" ]; then
            sudo tar -czf "$REMOTE_TMP_DIR/rxpulse-frontend-backup-last.tar.gz" -C "$WEB_ROOT" .
        fi
        
        # Clean current root and extract new build
        sudo rm -rf "$WEB_ROOT"/*
        sudo tar -xzf "$REMOTE_TMP_DIR/$TARBALL_NAME" -C "$WEB_ROOT/"
        
        # Set permissions
        sudo chown -R nginx:nginx "$WEB_ROOT"
        sudo chmod -R 755 "$WEB_ROOT"
        
        # Clean temporary file
        rm -f "$REMOTE_TMP_DIR/$TARBALL_NAME"
        
        # Test NGINX
        sudo nginx -t
        sudo systemctl reload nginx
        
        echo "    Web Server $server_ip successfully updated!"
EOF
done

# Clean local package
echo "[+] Cleaning local package..."
rm -f "$TARBALL_NAME"

echo "===================================================================="
echo "[+] Deployment process completed successfully!"
echo "===================================================================="
