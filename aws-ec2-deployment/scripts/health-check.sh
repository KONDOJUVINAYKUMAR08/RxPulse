#!/bin/bash
# ==============================================================================
# RxPulse Health Check & Diagnostic Script
# ==============================================================================
# Run this script to verify the health of all services across tiers.
#
# Usage:
#   ./health-check.sh [MONGO_IP] [APP_IP_OR_ALB_DNS] [FRONTEND_IP_OR_ALB_DNS]
# ==============================================================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}              RxPulse Deployment Diagnostic Checker                 ${NC}"
echo -e "${BLUE}====================================================================${NC}"

# Arguments or defaults
MONGO_IP="${1:-"127.0.0.1"}"
APP_HOST="${2:-"127.0.0.1"}"
FE_HOST="${3:-"127.0.0.1"}"

# Print configuration
echo -e "Diagnostic Targets:"
echo -e "  - MongoDB IP:       ${YELLOW}$MONGO_IP${NC}"
echo -e "  - Backend Host:     ${YELLOW}$APP_HOST${NC}"
echo -e "  - Frontend Host:    ${YELLOW}$FE_HOST${NC}"
echo -e "--------------------------------------------------------------------"

# Function to print success
print_ok() {
    echo -e "  [ ${GREEN}OK${NC} ] $1"
}

# Function to print failure
print_fail() {
    echo -e "  [ ${RED}FAIL${NC} ] $1"
}

# Function to print warning
print_warn() {
    echo -e "  [ ${YELLOW}WARN${NC} ] $1"
}

# ------------------------------------------------------------------------------
# 1. MongoDB Health Checks
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}1. Checking MongoDB Tier...${NC}"

# Check port 27017 socket
if nc -z -w3 "$MONGO_IP" 27017 >/dev/null 2>&1; then
    print_ok "MongoDB port 27017 is reachable."
    
    # Try connecting with mongosh if installed
    if command -v mongosh >/dev/null 2>&1; then
        if mongosh --host "$MONGO_IP" --eval "db.adminCommand('ping')" --connectTimeoutMS 2000 >/dev/null 2>&1; then
            print_ok "MongoDB connection handshake successful (unauthenticated ping)."
        else
            print_warn "MongoDB port open, but unauthenticated ping failed (auth may be enabled, which is correct)."
        fi
    else
        print_warn "mongosh is not installed locally. Skipping connection test."
    fi
else
    print_fail "MongoDB port 27017 is UNREACHABLE on $MONGO_IP."
fi

# ------------------------------------------------------------------------------
# 2. Backend Services Health Checks
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}2. Checking Backend App Tier (PM2 Microservices)...${NC}"

# Service array: Name, Port, Health Endpoint
declare -a services=(
    "user-service:3001:/health"
    "catalog-service:3002:/health"
    "inventory-service:3003:/health"
)

for svc in "${services[@]}"; do
    IFS=":" read -r name port path <<< "$svc"
    
    # Check socket port
    if nc -z -w3 "$APP_HOST" "$port" >/dev/null 2>&1; then
        print_ok "$name port $port is open."
        
        # Test HTTP Health endpoint
        URL="http://$APP_HOST:$port$path"
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$URL" || echo "000")
        
        if [ "$HTTP_STATUS" -eq 200 ]; then
            print_ok "$name Health endpoint returned 200 OK."
        else
            print_fail "$name Health endpoint returned status $HTTP_STATUS (expected 200) at $URL"
        fi
    else
        print_fail "$name port $port is UNREACHABLE on $APP_HOST."
    fi
done

# If local, check PM2 status
if command -v pm2 >/dev/null 2>&1; then
    echo -e "\n${BLUE}3. Checking PM2 Process Manager Status (Local)...${NC}"
    PM2_STATUS=$(sudo -u rxpulse pm2 status 2>/dev/null || pm2 status 2>/dev/null || true)
    if [ -n "$PM2_STATUS" ]; then
        echo "$PM2_STATUS"
    else
        print_fail "PM2 is installed but failed to query status."
    fi
fi

# ------------------------------------------------------------------------------
# 3. Frontend Web Tier (NGINX) Health Checks
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}4. Checking Frontend Web Tier (NGINX)...${NC}"

# Check Port 80 socket
if nc -z -w3 "$FE_HOST" 80 >/dev/null 2>&1; then
    print_ok "Frontend Web Server port 80 is open."
    
    # Check Web health endpoint
    URL_FE_HEALTH="http://$FE_HOST/health"
    FE_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$URL_FE_HEALTH" || echo "000")
    if [ "$FE_HEALTH_STATUS" -eq 200 ]; then
        print_ok "Frontend /health returned 200 OK."
    else
        print_fail "Frontend /health returned status $FE_HEALTH_STATUS at $URL_FE_HEALTH"
    fi
    
    # Check Root (HTML delivery)
    URL_FE_ROOT="http://$FE_HOST/"
    FE_ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$URL_FE_ROOT" || echo "000")
    if [ "$FE_ROOT_STATUS" -eq 200 ]; then
        print_ok "Frontend Root / loaded successfully."
    else
        print_fail "Frontend Root / returned status $FE_ROOT_STATUS at $URL_FE_ROOT"
    fi
else
    print_fail "Frontend Web Server port 80 is UNREACHABLE on $FE_HOST."
fi

# Check Port 443 socket (HTTPS - optional warning if not configured yet)
if nc -z -w3 "$FE_HOST" 443 >/dev/null 2>&1; then
    print_ok "Frontend HTTPS port 443 is open."
else
    print_warn "Frontend HTTPS port 443 is unreachable (expected if SSL/ALB 443 listener is not yet fully configured or tested directly)."
fi

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}                   Diagnostic Check Completed                       ${NC}"
echo -e "${BLUE}====================================================================${NC}"
