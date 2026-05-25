# RxPulse AWS EC2 Deployment Guide — 05 ALB Routing

This guide details how to create and configure the **Public Load Balancer** and the **Internal Load Balancer**, including Target Groups, Listeners, and path-based routing rules.

---

## 1. Routing Architecture

We deploy two Application Load Balancers (ALBs) to isolate network traffic:

1. **Public ALB** (`rxpulse-public-alb`):
   - Internet-facing, deployed in Public Subnets (`rxpulse-public-1`, `rxpulse-public-2`).
   - Standard listeners: HTTP (80) and HTTPS (443).
   - Default target group: `rxpulse-frontend-tg` (serves the static SPA).
   
2. **Internal ALB** (`rxpulse-internal-alb`):
   - Internal-only, deployed in Private Web Subnets (`rxpulse-web-private-1`, `rxpulse-web-private-2`).
   - Listeners: HTTP (80).
   - Performs path-based routing to direct `/api/users/*`, `/api/catalog/*`, and `/api/inventory/*` to the appropriate backend target groups on ports 3001, 3002, and 3003.

---

## 2. Creating Target Groups

You must create 4 Target Groups. Target type is **Instances**, and Protocol is **HTTP**.

| Target Group Name | Port | Health Check Path | Protocol | Timeout | Interval | Healthy Threshold |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `rxpulse-frontend-tg` | `80` | `/health` | HTTP | 5s | 15s | 2 |
| `rxpulse-user-tg` | `3001` | `/health` | HTTP | 5s | 15s | 2 |
| `rxpulse-catalog-tg` | `3002` | `/health` | HTTP | 5s | 15s | 2 |
| `rxpulse-inventory-tg` | `3003` | `/health` | HTTP | 5s | 15s | 2 |

### CLI Creation Commands:

```bash
# 1. Create Frontend Target Group
TG_FE=$(aws elbv2 create-target-group --name rxpulse-frontend-tg --protocol HTTP --port 80 --vpc-id $VPC_ID --health-check-path /health --health-check-interval-seconds 15 --healthy-threshold-count 2 --output text --query 'TargetGroups[0].TargetGroupArn')

# 2. Create User Service Target Group
TG_USER=$(aws elbv2 create-target-group --name rxpulse-user-tg --protocol HTTP --port 3001 --vpc-id $VPC_ID --health-check-path /health --health-check-interval-seconds 15 --healthy-threshold-count 2 --output text --query 'TargetGroups[0].TargetGroupArn')

# 3. Create Catalog Service Target Group
TG_CATALOG=$(aws elbv2 create-target-group --name rxpulse-catalog-tg --protocol HTTP --port 3002 --vpc-id $VPC_ID --health-check-path /health --health-check-interval-seconds 15 --healthy-threshold-count 2 --output text --query 'TargetGroups[0].TargetGroupArn')

# 4. Create Inventory Service Target Group
TG_INVENTORY=$(aws elbv2 create-target-group --name rxpulse-inventory-tg --protocol HTTP --port 3003 --vpc-id $VPC_ID --health-check-path /health --health-check-interval-seconds 15 --healthy-threshold-count 2 --output text --query 'TargetGroups[0].TargetGroupArn')
```

Register your backend EC2 instances into the target groups:
```bash
# Register frontend instances to frontend TG
aws elbv2 register-targets --target-group-arn $TG_FE --targets Id=<FRONTEND_EC2_1_ID> Id=<FRONTEND_EC2_2_ID>

# Register backend instances to microservices TGs
aws elbv2 register-targets --target-group-arn $TG_USER --targets Id=<BACKEND_EC2_1_ID> Id=<BACKEND_EC2_2_ID>
aws elbv2 register-targets --target-group-arn $TG_CATALOG --targets Id=<BACKEND_EC2_1_ID> Id=<BACKEND_EC2_2_ID>
aws elbv2 register-targets --target-group-arn $TG_INVENTORY --targets Id=<BACKEND_EC2_1_ID> Id=<BACKEND_EC2_2_ID>
```

---

## 3. Creating Load Balancers

### Step 1: Create Public ALB (Internet-facing)
```bash
ALB_PUB_ARN=$(aws elbv2 create-load-balancer --name rxpulse-public-alb --subnets $PUB1 $PUB2 --security-groups $SG_ALB --scheme internet-facing --output text --query 'LoadBalancers[0].LoadBalancerArn')
```

### Step 2: Create Internal ALB (Internal)
```bash
ALB_INT_ARN=$(aws elbv2 create-load-balancer --name rxpulse-internal-alb --subnets $WEB1 $WEB2 --security-groups $SG_INT_ALB --scheme internal --output text --query 'LoadBalancers[0].LoadBalancerArn')
```

---

## 4. Listener & Path-Based Routing Configuration

### Public ALB Listener
Create an HTTP listener that redirects to HTTPS (once SSL is set up in Route 53 guide) or forwards directly to the frontend target group for initial verification:

```bash
# HTTP listener forwarding to frontend target group
aws elbv2 create-listener --load-balancer-arn $ALB_PUB_ARN --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG_FE
```

### Internal ALB Listener & Rules
1. Create a default listener on Port 80 returning a fixed 404 response (or forwarding to user-service /health):
   ```bash
   LST_INT_ARN=$(aws elbv2 create-listener --load-balancer-arn $ALB_INT_ARN --protocol HTTP --port 80 --default-actions Type=fixed-response,FixedResponseConfig='{StatusCode=404,ContentType=text/plain,MessageBody="Not Found"}' --output text --query 'Listeners[0].ListenerArn')
   ```

2. Add path-based routing rules to dispatch traffic:
   
   - **Rule 1**: `/api/users/*` → `rxpulse-user-tg`
   - **Rule 2**: `/api/catalog/*` → `rxpulse-catalog-tg`
   - **Rule 3**: `/api/inventory/*` → `rxpulse-inventory-tg`
   - **Rule 4**: `/health` → `rxpulse-user-tg` (useful for top-level health checks)

   ```bash
   # Add rule for user-service
   aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 10 \
     --conditions Field=path-pattern,Values='/api/users/*' \
     --actions Type=forward,TargetGroupArn=$TG_USER
   
   # Add rule for catalog-service
   aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 20 \
     --conditions Field=path-pattern,Values='/api/catalog/*' \
     --actions Type=forward,TargetGroupArn=$TG_CATALOG
   
   # Add rule for inventory-service
   aws elbv2 create-rule --listener-arn $LST_INT_ARN --priority 30 \
     --conditions Field=path-pattern,Values='/api/inventory/*' \
     --actions Type=forward,TargetGroupArn=$TG_INVENTORY
   ```

---

## 5. Verification

To verify load balancer path routing, SSH into a frontend instance (in the web tier) and run:
```bash
# Get Internal ALB DNS Name
INT_ALB_DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns $ALB_INT_ARN --query 'LoadBalancers[0].DNSName' --output text)

# Query service health endpoints through the Internal ALB
curl http://$INT_ALB_DNS/api/users/health
curl http://$INT_ALB_DNS/api/catalog/health
curl http://$INT_ALB_DNS/api/inventory/health
```

Each should return standard `200 OK` JSON responses.

Next, proceed to **[06-route53-ssl.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/06-route53-ssl.md)** to configure Domain and SSL settings.
