# RxPulse AWS EC2 Deployment Runbook

This document is a step-by-step deployment runbook containing the exact commands and administrative procedures required to spin up the **RxPulse** production architecture from scratch.

---

## Phase 1: Network & VPC Provisioning

Create your VPC, subnets, route tables, and gateways.

```bash
# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --output text --query 'Vpc.VpcId')
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=rxpulse-vpc
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames '{"Value":true}'
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support '{"Value":true}'

# 2. Create Gateways
IGW_ID=$(aws ec2 create-internet-gateway --output text --query 'InternetGateway.InternetGatewayId')
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=rxpulse-igw

# 3. Create Subnets
PUB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
PUB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 modify-subnet-attribute --subnet-id $PUB1 --map-public-ip-on-launch
aws ec2 modify-subnet-attribute --subnet-id $PUB2 --map-public-ip-on-launch
aws ec2 create-tags --resources $PUB1 $PUB2 --tags Key=Name,Value=rxpulse-public-subnet

WEB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
WEB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $WEB1 $WEB2 --tags Key=Name,Value=rxpulse-web-subnet

APP1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.20.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
APP2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.21.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $APP1 $APP2 --tags Key=Name,Value=rxpulse-app-subnet

DB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.30.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
DB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.31.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $DB1 $DB2 --tags Key=Name,Value=rxpulse-db-subnet

# 4. Allocate EIP and Create NAT Gateway
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --output text --query 'AllocationId')
NAT_GW_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB1 --allocation-id $EIP_ALLOC --output text --query 'NatGateway.NatGatewayId')
aws ec2 create-tags --resources $NAT_GW_ID --tags Key=Name,Value=rxpulse-nat-gw
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_ID

# 5. Route Tables and Associations
RT_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID --output text --query 'RouteTable.RouteTableId')
aws ec2 create-route --route-table-id $RT_PUB --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUB1 --route-table-id $RT_PUB
aws ec2 associate-route-table --subnet-id $PUB2 --route-table-id $RT_PUB

RT_PVT=$(aws ec2 create-route-table --vpc-id $VPC_ID --output text --query 'RouteTable.RouteTableId')
aws ec2 create-route --route-table-id $RT_PVT --destination-cidr-block 0.0.0.0/0 --gateway-id $NAT_GW_ID
aws ec2 associate-route-table --subnet-id $WEB1 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $WEB2 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $APP1 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $APP2 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $DB1 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $DB2 --route-table-id $RT_PVT
```

---

## Phase 2: Security Group Configuration

Define the SG matrix. Fill in your IP to limit SSH access to the Bastion host.

```bash
# 1. Create SGs
SG_PUB_ALB=$(aws ec2 create-security-group --group-name rxpulse-pub-alb-sg --description "Public ALB Security Group" --vpc-id $VPC_ID --output text --query 'GroupId')
SG_BASTION=$(aws ec2 create-security-group --group-name rxpulse-bastion-sg --description "Bastion SG" --vpc-id $VPC_ID --output text --query 'GroupId')
SG_WEB=$(aws ec2 create-security-group --group-name rxpulse-web-sg --description "Web Tier SG" --vpc-id $VPC_ID --output text --query 'GroupId')
SG_INT_ALB=$(aws ec2 create-security-group --group-name rxpulse-int-alb-sg --description "Internal ALB SG" --vpc-id $VPC_ID --output text --query 'GroupId')
SG_APP=$(aws ec2 create-security-group --group-name rxpulse-app-sg --description "App Tier SG" --vpc-id $VPC_ID --output text --query 'GroupId')
SG_DB=$(aws ec2 create-security-group --group-name rxpulse-db-sg --description "DB Tier SG" --vpc-id $VPC_ID --output text --query 'GroupId')

# 2. Add Rules
# Public ALB Rules
aws ec2 authorize-security-group-ingress --group-id $SG_PUB_ALB --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_PUB_ALB --protocol tcp --port 443 --cidr 0.0.0.0/0

# Bastion rules (Replace YOUR_IP/32 with your actual public IP)
aws ec2 authorize-security-group-ingress --group-id $SG_BASTION --protocol tcp --port 22 --cidr YOUR_IP/32

# Web Tier rules
aws ec2 authorize-security-group-ingress --group-id $SG_WEB --protocol tcp --port 80 --source-group $SG_PUB_ALB
aws ec2 authorize-security-group-ingress --group-id $SG_WEB --protocol tcp --port 22 --source-group $SG_BASTION

# Internal ALB rules
aws ec2 authorize-security-group-ingress --group-id $SG_INT_ALB --protocol tcp --port 80 --source-group $SG_WEB

# App Tier rules
aws ec2 authorize-security-group-ingress --group-id $SG_APP --protocol tcp --port 3001-3003 --source-group $SG_INT_ALB
aws ec2 authorize-security-group-ingress --group-id $SG_APP --protocol tcp --port 22 --source-group $SG_BASTION

# DB Tier rules
aws ec2 authorize-security-group-ingress --group-id $SG_DB --protocol tcp --port 27017 --source-group $SG_APP
aws ec2 authorize-security-group-ingress --group-id $SG_DB --protocol tcp --port 22 --source-group $SG_BASTION
```

---

## Phase 3: DB Setup (MongoDB)

1. Launch a `t3.small` instance in subnet `rxpulse-db-private-1` using Security Group `rxpulse-db-sg` and assign a private IP (e.g. `10.0.30.10`).
2. SSH jump to the MongoDB instance via Bastion:
   ```bash
   ssh -A ec2-user@<BASTION_PUBLIC_IP>
   ssh ec2-user@10.0.30.10
   ```
3. Copy the script `setup-mongodb-ec2.sh` to the instance and execute it:
   ```bash
   chmod +x setup-mongodb-ec2.sh
   sudo ./setup-mongodb-ec2.sh "AdminSecurePassword123!" "UserSecurePassword123!" "CatalogSecurePassword123!" "InventorySecurePassword123!"
   ```
4. Verify that MongoDB is listening securely on Port 27017.

---

## Phase 4: Backend App Tier Setup

1. Launch an initial `t3.small` instance in private subnet `rxpulse-app-private-1` with Security Group `rxpulse-app-sg`.
2. SSH jump to the instance via Bastion.
3. Copy the backend provisioning script `setup-backend-ec2.sh` and run it:
   ```bash
   chmod +x setup-backend-ec2.sh
   # Usage: sudo ./setup-backend-ec2.sh [GIT_URL] [DB_IP] [INT_ALB_DNS] [JWT_SECRET]
   sudo ./setup-backend-ec2.sh "https://github.com/KONDOJUVINAYKUMAR08/RxPulse.git" "10.0.30.10" "internal-rxpulse-internal-alb-123456789.us-east-1.elb.amazonaws.com" "rxpulse_jwt_secret_2024_production_secure_key_change_me"
   ```
4. Run the seed script from this backend app instance to populate MongoDB:
   ```bash
   sudo chmod +x /opt/rxpulse/mongodb/seed-all.sh
   sudo /opt/rxpulse/mongodb/seed-all.sh
   ```
5. Check PM2 status:
   ```bash
   sudo -u rxpulse pm2 status
   ```

---

## Phase 5: Frontend Web Tier Setup

1. Launch an initial `t3.micro` instance in private subnet `rxpulse-web-private-1` with Security Group `rxpulse-web-sg`.
2. SSH jump to the instance via Bastion.
3. Copy the frontend provisioning script `setup-frontend-ec2.sh` and run it:
   ```bash
   chmod +x setup-frontend-ec2.sh
   # Usage: sudo ./setup-frontend-ec2.sh [GIT_URL] [INT_ALB_DNS]
   sudo ./setup-frontend-ec2.sh "https://github.com/KONDOJUVINAYKUMAR08/RxPulse.git" "internal-rxpulse-internal-alb-123456789.us-east-1.elb.amazonaws.com"
   ```
4. Confirm NGINX health:
   ```bash
   curl -I http://localhost/health
   ```

---

## Phase 6: Load Balancer Mappings

Set up target groups and listener rules.

```bash
# 1. Create Target Groups
TG_FE=$(aws elbv2 create-target-group --name rxpulse-frontend-tg --protocol HTTP --port 80 --vpc-id $VPC_ID --health-check-path /health --output text --query 'TargetGroups[0].TargetGroupArn')
TG_USER=$(aws elbv2 create-target-group --name rxpulse-user-tg --protocol HTTP --port 3001 --vpc-id $VPC_ID --health-check-path /health --output text --query 'TargetGroups[0].TargetGroupArn')
TG_CATALOG=$(aws elbv2 create-target-group --name rxpulse-catalog-tg --protocol HTTP --port 3002 --vpc-id $VPC_ID --health-check-path /health --output text --query 'TargetGroups[0].TargetGroupArn')
TG_INVENTORY=$(aws elbv2 create-target-group --name rxpulse-inventory-tg --protocol HTTP --port 3003 --vpc-id $VPC_ID --health-check-path /health --output text --query 'TargetGroups[0].TargetGroupArn')

# 2. Register Targets
aws elbv2 register-targets --target-group-arn $TG_FE --targets Id=<FRONTEND_WEB_EC2_ID>
aws elbv2 register-targets --target-group-arn $TG_USER --targets Id=<BACKEND_APP_EC2_ID>
aws elbv2 register-targets --target-group-arn $TG_CATALOG --targets Id=<BACKEND_APP_EC2_ID>
aws elbv2 register-targets --target-group-arn $TG_INVENTORY --targets Id=<BACKEND_APP_EC2_ID>

# 3. Create ALBs
ALB_PUB_ARN=$(aws elbv2 create-load-balancer --name rxpulse-public-alb --subnets $PUB1 $PUB2 --security-groups $SG_PUB_ALB --scheme internet-facing --output text --query 'LoadBalancers[0].LoadBalancerArn')
ALB_INT_ARN=$(aws elbv2 create-load-balancer --name rxpulse-internal-alb --subnets $WEB1 $WEB2 --security-groups $SG_INT_ALB --scheme internal --output text --query 'LoadBalancers[0].LoadBalancerArn')

# 4. Attach Listeners and Rules
aws elbv2 create-listener --load-balancer-arn $ALB_PUB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_FE

LST_INT_ARN=$(aws elbv2 create-listener --load-balancer-arn $ALB_INT_ARN --protocol HTTP --port 80 --default-actions Type=fixed-response,FixedResponseConfig='{StatusCode=404,ContentType=text/plain,MessageBody="Not Found"}' --output text --query 'Listeners[0].ListenerArn')

aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 10 --conditions Field=path-pattern,Values='/api/users/*' --actions Type=forward,TargetGroupArn=$TG_USER
aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 20 --conditions Field=path-pattern,Values='/api/catalog/*' --actions Type=forward,TargetGroupArn=$TG_CATALOG
aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 30 --conditions Field=path-pattern,Values='/api/inventory/*' --actions Type=forward,TargetGroupArn=$TG_INVENTORY
```

---

## Phase 7: Domain Name mapping and SSL certificate registration

1. Create a public Hosted Zone in Route 53 for `rxpulse.online`. Update Name Servers in your domain registrar.
2. Request ACM Certificate:
   ```bash
   ACM_CERT_ARN=$(aws acm request-certificate --domain-name rxpulse.online --validation-method DNS --subject-alternative-names "*.rxpulse.online" --output text --query 'CertificateArn')
   ```
3. Generate DNS validation CNAMEs in Hosted Zone via console/CLI and wait until certificate state transitions to `ISSUED`.
4. Create A Record (Alias) pointing `rxpulse.online` and `www.rxpulse.online` to the Public ALB.
5. Create HTTPS listener on Public ALB (port 443) forwarding to `rxpulse-frontend-tg` using `$ACM_CERT_ARN`.
6. Update HTTP listener on Public ALB (port 80) to redirect requests permanently to port 443.

---

## Phase 8: Setting Up Auto Scaling Groups

1. Create Launch Templates for Web and App tiers utilizing the User Data scripts outlined in Guide 07.
2. Spin up Auto Scaling Groups `rxpulse-frontend-asg` and `rxpulse-backend-asg` in their respective private subnets. Set capacity sizes (Min: 2, Max: 4, Desired: 2).
3. Connect the ASGs to their Load Balancer Target Groups.
4. Set Target Tracking Scaling Policies (CPU tracking at 60% for Web tier and 70% for App tier).

---

## Phase 9: Verification Checks

Execute the following verification calls from Bastion to confirm successful deployment:

```bash
# 1. Verify DB
mongosh --host 10.0.30.10 -u admin -p "AdminSecurePassword123!" --authenticationDatabase admin --eval "db.adminCommand('ping')"

# 2. Verify backend microservices
curl http://<BACKEND_APP_PRIVATE_IP>:3001/health
curl http://<BACKEND_APP_PRIVATE_IP>:3002/health
curl http://<BACKEND_APP_PRIVATE_IP>:3003/health

# 3. Verify Internal ALB path forwarding
INT_ALB_DNS=$(aws elbv2 describe-load-balancers --names rxpulse-internal-alb --query 'LoadBalancers[0].DNSName' --output text)
curl http://$INT_ALB_DNS/api/users/health
curl http://$INT_ALB_DNS/api/catalog/health
curl http://$INT_ALB_DNS/api/inventory/health

# 4. Verify Frontend
curl http://<FRONTEND_WEB_PRIVATE_IP>/health

# 5. Verify Public ALB Domain & SSL Redirect
curl -I http://rxpulse.online  # Expected: HTTP/1.1 301 Moved Permanently (redirect to https)
curl -I https://rxpulse.online # Expected: HTTP/2 200 OK

# 6. Verify end-to-end auth login request
curl -X POST https://rxpulse.online/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rxpulse.com","password":"Admin@123"}'
```
