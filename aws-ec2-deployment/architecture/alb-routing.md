# RxPulse AWS EC2 Deployment Architecture — ALB Routing Strategy

This document details the Load Balancing configuration, Target Group definitions, path-based routing rules, and listener configurations for both the Public and Internal Application Load Balancers (ALBs) in the **RxPulse** architecture.

---

## 1. Load Balancing Layout

```
[ Client Request ]
       │
       ▼ Domain: rxpulse.online (HTTPS:443)
┌─────────────────────────────────────────────────────────┐
│ Public ALB (rxpulse-public-alb)                         │
│ Default Action: Forward to rxpulse-frontend-tg (Port 80)│
└──────────────────────────┬──────────────────────────────┘
                           │
                           ├─► Frontend Instance 1 (10.0.10.x:80)
                           └─► Frontend Instance 2 (10.0.11.x:80)
                                     │
                                     ▼ Proxy Pass: /api/*
┌─────────────────────────────────────────────────────────┐
│ Internal ALB (rxpulse-internal-alb)                      │
├──────────────────────────┬──────────────────────────────┤
│ Path: /api/users/*       │ Path: /api/catalog/*         │ Path: /api/inventory/*
▼                          ▼                              ▼
[ rxpulse-user-tg (3001) ] [ rxpulse-catalog-tg (3002) ]  [ rxpulse-inventory-tg (3003) ]
```

---

## 2. Public ALB Listener Configuration

The Public Load Balancer is internet-facing and handles initial SSL termination.

### 2.1 HTTP Listener (Port 80)
- **Protocol**: HTTP
- **Port**: 80
- **Actions**:
  - Redirect to HTTPS:443
  - Status code: `HTTP_301` (Permanent redirect)

### 2.2 HTTPS Listener (Port 443)
- **Protocol**: HTTPS
- **Port**: 443
- **SSL Policy**: `ELBSecurityPolicy-TLS13-1-2-2021-06`
- **Default Action**: Forward to Target Group `rxpulse-frontend-tg` (Port 80)
- **Rules**:
  - None required. All client requests (e.g. `https://rxpulse.online/`) default to serving the React SPA. Any `/api/*` requests are routed to NGINX on the frontend instances, which then proxies them to the Internal ALB.

---

## 3. Internal ALB Listener & Rules Mappings

The Internal Load Balancer handles backend microservices load distribution inside the VPC.

### 3.1 HTTP Listener (Port 80)
- **Protocol**: HTTP
- **Port**: 80
- **Default Action**: Return HTTP `404 Not Found` (Secures unknown path requests)
- **Routing Rules**:

| Rule Priority | Path Pattern | Target Group | Destination Port |
| :--- | :--- | :--- | :--- |
| **10** | `/api/users/*` | `rxpulse-user-tg` | 3001 (user-service) |
| **20** | `/api/catalog/*` | `rxpulse-catalog-tg` | 3002 (catalog-service) |
| **30** | `/api/inventory/*` | `rxpulse-inventory-tg` | 3003 (inventory-service) |
| **40** | `/health` | `rxpulse-user-tg` | 3001 (default service health) |

---

## 4. Target Group Configurations

Target Groups verify instance health. All Target Groups are configured with a target type of `Instance` and protocols set to `HTTP`.

### 4.1 Target Group Specs:

```yaml
rxpulse-frontend-tg:
  Port: 80
  HealthCheckProtocol: HTTP
  HealthCheckPath: /health
  Interval: 15 seconds
  Timeout: 5 seconds
  HealthyThresholdCount: 2
  UnhealthyThresholdCount: 3

rxpulse-user-tg:
  Port: 3001
  HealthCheckProtocol: HTTP
  HealthCheckPath: /health
  Interval: 15 seconds
  Timeout: 5 seconds
  HealthyThresholdCount: 2
  UnhealthyThresholdCount: 3

rxpulse-catalog-tg:
  Port: 3002
  HealthCheckProtocol: HTTP
  HealthCheckPath: /health
  Interval: 15 seconds
  Timeout: 5 seconds
  HealthyThresholdCount: 2
  UnhealthyThresholdCount: 3

rxpulse-inventory-tg:
  Port: 3003
  HealthCheckProtocol: HTTP
  HealthCheckPath: /health
  Interval: 15 seconds
  Timeout: 5 seconds
  HealthyThresholdCount: 2
  UnhealthyThresholdCount: 3
```

---

## 5. Load Balancing Algorithm & Sticky Sessions

- **Algorithm**: Round Robin (Default). Works optimally as backend requests are stateless.
- **Stickiness**: Disabled. Authentication is completely stateless, powered by JWT tokens. Since JWTs are verified locally on each service instance using the shared secret, any server in the Target Group can handle any request at any time.
- **Deregistration Delay (Connection Draining)**: Set to `60 seconds` (reduces downtime during scale-in and deployments by allowing active connections to complete).
