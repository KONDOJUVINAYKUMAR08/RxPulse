# RxPulse AWS EC2 Deployment Architecture — Networking Diagram

This document contains the structural network topology diagram and CIDR routing tables for the **RxPulse** production infrastructure.

---

## 1. Network Architecture Diagram

The diagram below illustrates how subnets are isolated across Availability Zones (AZs) and how routing is directed via Gateways and Application Load Balancers (ALBs):

```mermaid
graph TB
    subgraph VPC ["AWS VPC (10.0.0.0/16)"]
        subgraph AZ1 ["Availability Zone: us-east-1a"]
            SUB_PUB1["Public Subnet 1<br>(10.0.1.0/24)"]
            SUB_WEB1["Private Web Subnet 1<br>(10.0.10.0/24)"]
            SUB_APP1["Private App Subnet 1<br>(10.0.20.0/24)"]
            SUB_DB1["Private DB Subnet 1<br>(10.0.30.0/24)"]
        end

        subgraph AZ2 ["Availability Zone: us-east-1b"]
            SUB_PUB2["Public Subnet 2<br>(10.0.2.0/24)"]
            SUB_WEB2["Private Web Subnet 2<br>(10.0.11.0/24)"]
            SUB_APP2["Private App Subnet 2<br>(10.0.21.0/24)"]
            SUB_DB2["Private DB Subnet 2<br>(10.0.31.0/24)"]
        end

        IGW["Internet Gateway<br>(IGW)"]
        NAT["NAT Gateway<br>(Allocated to Public 1)"]
        
        PUB_ALB["Public ALB<br>(rxpulse-public-alb)"]
        INT_ALB["Internal ALB<br>(rxpulse-internal-alb)"]
        
        BASTION["Bastion Host<br>(rxpulse-bastion)"]
        
        FE_ASG["Frontend ASG<br>(NGINX instances)"]
        APP_ASG["Backend ASG<br>(PM2 Node.js instances)"]
        DB_INST["MongoDB Server<br>(mongod instance)"]
    end

    Internet["Public Internet"]

    %% Traffic Flow
    Internet <=>|HTTPS:443| IGW
    IGW <=>|HTTPS:443| PUB_ALB
    
    PUB_ALB ==>|Forward HTTP:80| SUB_WEB1 & SUB_WEB2
    SUB_WEB1 & SUB_WEB2 -.-> FE_ASG
    
    FE_ASG ==>|Proxy API HTTP:80| INT_ALB
    INT_ALB ==>|Path Routing HTTP:3001-3003| SUB_APP1 & SUB_APP2
    SUB_APP1 & SUB_APP2 -.-> APP_ASG
    
    APP_ASG ==>|TCP:27017| SUB_DB1
    SUB_DB1 -.-> DB_INST
    
    %% Bastion Admin Route
    BASTION -.->|SSH Port:22| SUB_WEB1 & SUB_WEB2 & SUB_APP1 & SUB_APP2 & SUB_DB1
    
    %% Outbound Route to Internet for Updates
    FE_ASG & APP_ASG & DB_INST ===>|Outbound 0.0.0.0/0| NAT
    NAT ===>|Forward Outbound| IGW
    
    classDef subnet fill:#f9f,stroke:#333,stroke-width:2px;
    classDef resource fill:#bbf,stroke:#333,stroke-width:1px;
    class SUB_PUB1,SUB_PUB2,SUB_WEB1,SUB_WEB2,SUB_APP1,SUB_APP2,SUB_DB1,SUB_DB2 subnet;
    class PUB_ALB,INT_ALB,BASTION,FE_ASG,APP_ASG,DB_INST resource;
```

---

## 2. Route Tables Configuration

### 2.1 Public Route Table (`rxpulse-public-rt`)
Associated with: `rxpulse-public-1` and `rxpulse-public-2` subnets.

| Destination | Target | Description |
| :--- | :--- | :--- |
| `10.0.0.0/16` | `local` | Internal VPC Routing |
| `0.0.0.0/0` | `igw-xxxxxxxx` (Internet Gateway) | Default Internet Gateway Route |

### 2.2 Private Route Table (`rxpulse-private-rt`)
Associated with: `web-private`, `app-private`, and `db-private` subnets.

| Destination | Target | Description |
| :--- | :--- | :--- |
| `10.0.0.0/16` | `local` | Internal VPC Routing |
| `0.0.0.0/0` | `nat-xxxxxxxx` (NAT Gateway) | Outbound Route to pull package updates |
