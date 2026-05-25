# RxPulse AWS EC2 Deployment Architecture — Overview

This document provides a high-level technical overview of the production-ready AWS 3-tier architecture designed for **RxPulse**, migrating the application from local containerized environments to a secure, resilient, and auto-scaling EC2-based setup without container runtimes (Docker/Kubernetes).

---

## 1. Design Principles

1. **High Availability**: Load balancers (ALBs) and Auto Scaling Groups (ASGs) are configured across multiple Availability Zones (AZs) in `us-east-1` (us-east-1a and us-east-1b).
2. **Zero-Trust Network Isolation**: All computing workloads (Frontend Web servers, Backend App microservices, and MongoDB Databases) are located in private subnets. Direct access to databases and microservices is blocked; requests flow strictly through sequential layers verified by Security Group rules.
3. **Operational Autonomy**: Backend microservices are managed by **PM2**, which handles process monitoring, automated crash recovery, clustering, and logging. Bootstrapping is managed by custom OS-level systemd service hooks.
4. **Cost Optimization**: Workloads are allocated to right-sized instance classes (`t3.micro` for Frontend serving, `t3.small` for consolidated backend services, and `t3.small` for MongoDB databases) minimizing overhead while utilizing Savings Plans.

---

## 2. 3-Tier Architecture Model

```
       [ Public Client Request ]
                   │
                   ▼ HTTPS (443)
      ┌─────────────────────────┐
      │  Public Load Balancer   │ (Internet Gateway Attached)
      └────────────┬────────────┘
                   │ Forward HTTP (80)
                   ▼
      ┌─────────────────────────┐
      │    Frontend Web Tier    │ (Private Subnets, NGINX Web Server)
      └────────────┬────────────┘
                   │ API Proxy HTTP (80)
                   ▼
      ┌─────────────────────────┐
      │  Internal Load Balancer │ (Private Subnets, Path Routing)
      └────────────┬────────────┘
                   │ Forward to Ports 3001-3003
                   ▼
      ┌─────────────────────────┐
      │   Backend App Tier      │ (Private Subnets, PM2 Node.js apps)
      └────────────┬────────────┘
                   │ Port 27017 (MongoDB Protocol)
                   ▼
      ┌─────────────────────────┐
      │      Database Tier      │ (Private Subnets, MongoDB 6.0)
      └─────────────────────────┘
```

### Tier 1: Public Web Front (NGINX)
- Serves the compiled React Vite single page application static assets.
- Resolves all client-side URL routing internally using NGINX `try_files` fallbacks.
- Proxies `/api/*` API requests securely to the Internal Load Balancer.

### Tier 2: Private App Tier (PM2 Backend Services)
- Runs all 3 backend microservices:
  - **user-service** (Port 3001)
  - **catalog-service** (Port 3002)
  - **inventory-service** (Port 3003)
- PM2 coordinates runtime monitoring, cluster scaling, and error reporting.
- A systemd unit `rxpulse-backend.service` guarantees PM2 resurrects on instance boot.

### Tier 3: Private Database Tier (MongoDB)
- Deploys a single database instance inside its own security domain.
- Hosts three independent logical databases (`users_db`, `catalog_db`, `inventory_db`) matching microservice boundaries.
- Hardened with credential-based access control and local-IP-only socket bindings.

---

## 3. Microservices Communication Flow

### JWT Authentication Hook
- **user-service** provides authentication routes (`/api/users/login`, `/api/users/register`) and creates signed JWTs using a shared `JWT_SECRET`.
- **catalog-service** and **inventory-service** perform authentication checks locally on incoming requests. Because they share the identical `JWT_SECRET`, token decoding is done locally without invoking user-service over the network. This eliminates inter-service authentication latency.

### Data Aggregation
- **inventory-service** queries metadata from **catalog-service** and **user-service** via relative routing configurations pointing to the **Internal Load Balancer DNS** (`http://<INTERNAL_ALB_DNS>`).
- The Internal ALB parses paths (`/api/users/*` vs `/api/catalog/*`) and routes the calls to the correct instances in the backend ASG.

---

## 4. Cost Breakdown Summary

Using on-demand pricing in `us-east-1`, the architectural cost is estimated at **~$134/month**:

- **Bastion Host** (`t3.micro`): ~$8/mo (Can be stopped when not in use)
- **Frontend ASG** (2x `t3.micro`): ~$16/mo
- **Backend ASG** (2x `t3.small`): ~$30/mo
- **Database Server** (1x `t3.small`): ~$15/mo
- **NAT Gateway** (1x NAT GW + Data): ~$32/mo
- **Load Balancers** (1x Public ALB, 1x Internal ALB): ~$32/mo
- **Route 53 DNS Zone**: ~$0.50/mo
- **EBS Storage** (GP3 volumes): ~$10/mo

*Tip: Standardizing on 1-year Savings Plans or Reserved Instances can lower computing costs by up to 35-40%, reducing total budget to under $100/mo.*
