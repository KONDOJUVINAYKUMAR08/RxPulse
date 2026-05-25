# RxPulse AWS EC2 Deployment Guide — 03 Backend Setup

This guide details how to configure the Private App Tier instances (`rxpulse-app-private-1` and `rxpulse-app-private-2`) running **user-service**, **catalog-service**, and **inventory-service** managed by **PM2** on Node.js 18.

---

## 1. Instance Launch Specifications

Ensure your Backend App EC2 instances are launched with the following specifications:
- **AMI**: Amazon Linux 2023
- **Instance Type**: `t3.small` (Required to run all three Node.js services concurrently)
- **Subnets**: `rxpulse-app-private-1` and `rxpulse-app-private-2` (Private IP only)
- **Security Group**: `rxpulse-app-sg`
  - Inbound TCP `3001` - `3003` from `rxpulse-int-alb-sg`
  - Inbound TCP `22` from `rxpulse-bastion-sg`
- **IAM Role**: Associate a role with `AmazonS3ReadOnlyAccess` if you need to pull code zip archives or configurations from private S3 buckets.

---

## 2. Server Provisioning Steps

SSH jump to the private Backend App EC2 instance from Bastion:
```bash
ssh-jump <BACKEND_APP_PRIVATE_IP>
```

Execute the provisioning commands as root or run `setup-backend-ec2.sh`:

```bash
# 1. Update system packages
sudo dnf update -y

# 2. Install Node.js 18 LTS
sudo dnf module enable nodejs:18 -y || true
sudo dnf install -y nodejs git

# Verify Node installation
node -v  # Expected v18.x.x
npm -v   # Expected v9.x.x or newer

# 3. Install PM2 globally
sudo npm install -g pm2
```

---

## 3. Creating Secure System User & Directory Setup

Never run Node.js applications as `root`. We will create a dedicated system user `rxpulse` to run the services.

```bash
# Create system user 'rxpulse'
sudo useradd -r -m -s /bin/bash rxpulse

# Create application folders
sudo mkdir -p /opt/rxpulse
sudo mkdir -p /var/log/rxpulse

# Change ownership
sudo chown -R rxpulse:rxpulse /opt/rxpulse
sudo chown -R rxpulse:rxpulse /var/log/rxpulse
sudo chmod -R 775 /var/log/rxpulse
```

---

## 4. Source Code Deployment & Dependency Installation

1. Copy the source directories (`user-service`, `catalog-service`, `inventory-service`) to `/opt/rxpulse/` using SCP via Bastion, or clone your private git repo:
   ```bash
   cd /opt/rxpulse
   # If cloning:
   # sudo -u rxpulse git clone <REPO_URL> .
   ```
2. Install npm production dependencies for each microservice:
   ```bash
   for svc in user-service catalog-service inventory-service; do
     echo "Installing dependencies for $svc..."
     cd /opt/rxpulse/$svc
     sudo -u rxpulse npm ci --omit=dev
   done
   ```

---

## 5. Setting Up Environment Configurations

Create `.env` files in each service directory using the provided production templates.

### User Service (`/opt/rxpulse/user-service/.env`)
```ini
PORT=3001
NODE_ENV=production
MONGO_URI=mongodb://user_service_user:UserSecurePassword123!@<MONGODB_PRIVATE_IP>:27017/users_db?authSource=admin
JWT_SECRET=rxpulse_jwt_secret_2024_production_secure_key_change_me
JWT_EXPIRES_IN=7d
```

### Catalog Service (`/opt/rxpulse/catalog-service/.env`)
```ini
PORT=3002
NODE_ENV=production
MONGO_URI=mongodb://catalog_service_user:CatalogSecurePassword123!@<MONGODB_PRIVATE_IP>:27017/catalog_db?authSource=admin
JWT_SECRET=rxpulse_jwt_secret_2024_production_secure_key_change_me
AUTH_SERVICE_URL=http://<INTERNAL_ALB_DNS>
```

### Inventory Service (`/opt/rxpulse/inventory-service/.env`)
```ini
PORT=3003
NODE_ENV=production
MONGO_URI=mongodb://inventory_service_user:InventorySecurePassword123!@<MONGODB_PRIVATE_IP>:27017/inventory_db?authSource=admin
JWT_SECRET=rxpulse_jwt_secret_2024_production_secure_key_change_me
AUTH_SERVICE_URL=http://<INTERNAL_ALB_DNS>
CATALOG_SERVICE_URL=http://<INTERNAL_ALB_DNS>
```

---

## 6. PM2 Process Launch & Systemd Persistence

1. Copy `ecosystem.config.js` to `/opt/rxpulse/ecosystem.config.js`.
2. Start the applications as the `rxpulse` user:
   ```bash
   sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 start /opt/rxpulse/ecosystem.config.js
   ```
3. Save the PM2 process list configuration so it persists across restarts:
   ```bash
   sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 save
   ```
4. Install the custom systemd service file `rxpulse-backend.service` into `/etc/systemd/system/`:
   ```bash
   sudo cp /opt/rxpulse-src/aws-ec2-deployment/systemd/rxpulse-backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable rxpulse-backend.service
   sudo systemctl restart rxpulse-backend.service
   ```

---

## 7. Diagnostics and Monitoring

Verify that all three services are running:
```bash
sudo -u rxpulse pm2 status
```

To view consolidated logs or individual service logs:
```bash
# All logs
sudo -u rxpulse pm2 logs

# Specific service error logs
tail -n 50 /var/log/rxpulse/user-service-error.log
tail -n 50 /var/log/rxpulse/catalog-service-error.log
tail -n 50 /var/log/rxpulse/inventory-service-error.log
```

Next, proceed to **[04-frontend-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/04-frontend-setup.md)** to configure the Frontend Web tier.
