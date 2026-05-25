# RxPulse AWS EC2 Deployment Guide — 07 Auto Scaling

This guide details how to set up **Launch Templates** and **Auto Scaling Groups (ASGs)** for both the Frontend Web Tier and Backend App Tier, enabling automatic recovery and dynamic scaling.

---

## 1. Auto Scaling Architecture

```
Internet ---> Public ALB ---> [ Frontend ASG (Port 80) ]
                                 │
                                 └──> Internal ALB ---> [ Backend ASG (Ports 3001-3003) ]
                                                            │
                                                            └──> Database EC2
```

We configure two distinct Auto Scaling Groups:
1. **Frontend ASG**: Serves NGINX configurations and static React files. Scales on CPU > 60%.
2. **Backend ASG**: Runs the Node.js PM2 process manager backend microservices. Scales on CPU > 70%.

Instances within both ASGs are launched into private subnets, ensuring no direct public internet exposure.

---

## 2. Launch Templates Configuration

Launch Templates contain the instance configuration (AMI, type, keys, security groups) and the **User Data** bootstrap scripts executed on first boot.

### 2.1 Frontend Launch Template (`rxpulse-frontend-lt`)
- **AMI**: Amazon Linux 2023
- **Instance Type**: `t3.micro`
- **Security Group**: `rxpulse-web-sg`
- **Key Pair**: Choose your administration SSH key.
- **Resource Tags**: `Project=RxPulse`, `Tier=Web`

#### User Data (Bootstrap Script):
Copy and paste this script into the **User Data** section under *Advanced details*:

```bash
#!/bin/bash
# Enable logging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== BOOTSTRAP: Starting Frontend Setup ==="
# Export vars
export GIT_REPO="https://github.com/KONDOJUVINAYKUMAR08/RxPulse.git"
export INTERNAL_ALB_DNS="internal-rxpulse-internal-alb-123456789.us-east-1.elb.amazonaws.com"

# Install packages
dnf update -y
dnf module enable nodejs:18 -y || true
dnf install -y nodejs git nginx

# Set up folders
mkdir -p /var/www/rxpulse/html
chown -R nginx:nginx /var/www/rxpulse

# Clone and build
git clone $GIT_REPO /opt/rxpulse-src
cd /opt/rxpulse-src/frontend
npm ci
npm run build

# Deploy assets
cp -r dist/* /var/www/rxpulse/html/
chown -R nginx:nginx /var/www/rxpulse/html

# Deploy NGINX Config
sed "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" /opt/rxpulse-src/aws-ec2-deployment/frontend/nginx/rxpulse.conf > /etc/nginx/conf.d/rxpulse.conf

# Start NGINX
systemctl daemon-reload
systemctl enable nginx --now
echo "=== BOOTSTRAP: Frontend Setup Complete ==="
```

---

### 2.2 Backend Launch Template (`rxpulse-backend-lt`)
- **AMI**: Amazon Linux 2023
- **Instance Type**: `t3.small`
- **Security Group**: `rxpulse-app-sg`
- **Key Pair**: Choose your administration SSH key.
- **Resource Tags**: `Project=RxPulse`, `Tier=App`

#### User Data (Bootstrap Script):
```bash
#!/bin/bash
# Enable logging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== BOOTSTRAP: Starting Backend Setup ==="
# Export vars
export GIT_REPO="https://github.com/KONDOJUVINAYKUMAR08/RxPulse.git"
export MONGODB_PRIVATE_IP="10.0.30.10" # Replace with actual private DB IP
export INTERNAL_ALB_DNS="internal-rxpulse-internal-alb-123456789.us-east-1.elb.amazonaws.com"
export JWT_SECRET="rxpulse_jwt_secret_2024_production_secure_key_change_me"

# Install packages
dnf update -y
dnf module enable nodejs:18 -y || true
dnf install -y nodejs git
npm install -g pm2

# Create system user
useradd -r -m -s /bin/bash rxpulse
mkdir -p /opt/rxpulse /var/log/rxpulse
chown -R rxpulse:rxpulse /opt/rxpulse /var/log/rxpulse
chmod -R 775 /var/log/rxpulse

# Clone and deploy
git clone $GIT_REPO /opt/rxpulse-src
cp -r /opt/rxpulse-src/services/user-service /opt/rxpulse/
cp -r /opt/rxpulse-src/services/catalog-service /opt/rxpulse/
cp -r /opt/rxpulse-src/services/inventory-service /opt/rxpulse/
cp /opt/rxpulse-src/aws-ec2-deployment/backend/ecosystem.config.js /opt/rxpulse/
chown -R rxpulse:rxpulse /opt/rxpulse

# Install dependencies and config envs
for svc in user-service catalog-service inventory-service; do
  cd /opt/rxpulse/$svc
  sudo -u rxpulse npm ci --omit=dev
done

# Build env configs
sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
  /opt/rxpulse-src/aws-ec2-deployment/environment-configs/user-service.env > /opt/rxpulse/user-service/.env

sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" -e "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
  /opt/rxpulse-src/aws-ec2-deployment/environment-configs/catalog-service.env > /opt/rxpulse/catalog-service/.env

sed -e "s|<MONGODB_PRIVATE_IP>|$MONGODB_PRIVATE_IP|g" -e "s|<INTERNAL_ALB_DNS>|$INTERNAL_ALB_DNS|g" -e "s|rxpulse_jwt_secret_2024_production_secure_key_change_me|$JWT_SECRET|g" \
  /opt/rxpulse-src/aws-ec2-deployment/environment-configs/inventory-service.env > /opt/rxpulse/inventory-service/.env

chown -R rxpulse:rxpulse /opt/rxpulse

# Install systemd service
cp /opt/rxpulse-src/aws-ec2-deployment/systemd/rxpulse-backend.service /etc/systemd/system/
systemctl daemon-reload

# Start services under rxpulse
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin pm2 startup systemd -u rxpulse --hp /home/rxpulse | tail -n 1 > /tmp/pm2-startup-cmd.sh
chmod +x /tmp/pm2-startup-cmd.sh
/tmp/pm2-startup-cmd.sh || true
rm -f /tmp/pm2-startup-cmd.sh

# Run ecosystem config and save
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 start /opt/rxpulse/ecosystem.config.js
sudo -u rxpulse env PATH=$PATH:/usr/bin:/usr/local/bin PM2_HOME=/home/rxpulse/.pm2 pm2 save

systemctl enable pm2-rxpulse.service || true
systemctl enable rxpulse-backend.service
systemctl restart rxpulse-backend.service
echo "=== BOOTSTRAP: Backend Setup Complete ==="
```

---

## 3. Auto Scaling Group Setup

### 3.1 Frontend ASG (`rxpulse-frontend-asg`)
- **Launch Template**: `rxpulse-frontend-lt` (latest version)
- **VPC**: `rxpulse-vpc`
- **Subnets**: `rxpulse-web-private-1` and `rxpulse-web-private-2`
- **Group size**:
  - Desired capacity: `2`
  - Minimum capacity: `2`
  - Maximum capacity: `4`
- **Load balancing**: Attach to an existing load balancer target group -> Select **`rxpulse-frontend-tg`**
- **Health check type**: **ELB** (Checks health using load balancer calls to `/health` rather than raw EC2 state)
- **Health check grace period**: `300` seconds

### 3.2 Backend ASG (`rxpulse-backend-asg`)
- **Launch Template**: `rxpulse-backend-lt` (latest version)
- **VPC**: `rxpulse-vpc`
- **Subnets**: `rxpulse-app-private-1` and `rxpulse-app-private-2`
- **Group size**:
  - Desired capacity: `2`
  - Minimum capacity: `2`
  - Maximum capacity: `4`
- **Load balancing**: Attach to an existing load balancer target group -> Select:
  - **`rxpulse-user-tg`**
  - **`rxpulse-catalog-tg`**
  - **`rxpulse-inventory-tg`**
- **Health check type**: **ELB**
- **Health check grace period**: `300` seconds

---

## 4. Scaling Policies Configuration

We configure dynamic scale-out and scale-in policies based on CPU utilization metrics:

### Frontend Target Tracking Policy
- **Metric type**: Average CPU utilization
- **Target value**: `60` %
- **Instances warm-up**: `300` seconds

### Backend Target Tracking Policy
- **Metric type**: Average CPU utilization
- **Target value**: `70` %
- **Instances warm-up**: `300` seconds

Next, proceed to **[08-security.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/08-security.md)** to configure Security Groups and IAM roles.
