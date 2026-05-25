# RxPulse AWS EC2 Deployment Guide — 01 AWS Infrastructure

This guide outlines the step-by-step setup of the custom Virtual Private Cloud (VPC), subnetting, routing, gateways, and load balancer placements needed for a highly available, secure 3-tier application deployment of **RxPulse**.

---

## 1. Network Topology Overview

We will create a VPC with a CIDR block of `10.0.0.0/16` spanning across two Availability Zones (AZs) in `us-east-1` (us-east-1a and us-east-1b) containing 8 subnets in total:

```
VPC: 10.0.0.0/16
├── us-east-1a (AZ1)
│   ├── public-subnet-1 (10.0.1.0/24)  — Public Load Balancer, Bastion, NAT GW
│   ├── web-private-1   (10.0.10.0/24) — Frontend EC2
│   ├── app-private-1   (10.0.20.0/24) — PM2 Backend App EC2
│   └── db-private-1    (10.0.30.0/24) — MongoDB EC2
└── us-east-1b (AZ2)
    ├── public-subnet-2 (10.0.2.0/24)  — Public Load Balancer (multi-AZ)
    ├── web-private-2   (10.0.11.0/24) — Frontend EC2
    ├── app-private-2   (10.0.21.0/24) — PM2 Backend App EC2
    └── db-private-2    (10.0.31.0/24) — Reserved for DB Replica (future)
```

---

## 2. Step-by-Step VPC & Subnets Setup

### Option A: Via AWS Console

1. Navigate to the **VPC Dashboard** in the AWS Management Console.
2. Click **Create VPC**.
3. Choose **VPC and more** (this auto-creates subnets, route tables, and gateways, but doing it manually via **VPC only** is recommended for precision).
4. If choosing **VPC only**:
   - **Name tag**: `rxpulse-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16`
   - Click **Create VPC**.

#### Create the 8 Subnets:
Navigate to **Subnets** in the sidebar, click **Create subnet**, choose `rxpulse-vpc`, and create the following:

| Subnet Name | IPv4 CIDR | Availability Zone |
| :--- | :--- | :--- |
| `rxpulse-public-1` | `10.0.1.0/24` | `us-east-1a` |
| `rxpulse-public-2` | `10.0.2.0/24` | `us-east-1b` |
| `rxpulse-web-private-1` | `10.0.10.0/24` | `us-east-1a` |
| `rxpulse-web-private-2` | `10.0.11.0/24` | `us-east-1b` |
| `rxpulse-app-private-1` | `10.0.20.0/24` | `us-east-1a` |
| `rxpulse-app-private-2` | `10.0.21.0/24` | `us-east-1b` |
| `rxpulse-db-private-1` | `10.0.30.0/24` | `us-east-1a` |
| `rxpulse-db-private-2` | `10.0.31.0/24` | `us-east-1b` |

### Option B: Via AWS CLI

Run the following commands locally or inside a CloudShell session:

```bash
# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --output text --query 'Vpc.VpcId')
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=rxpulse-vpc
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames '{"Value":true}'
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support '{"Value":true}'

# 2. Create Subnets
# Public Subnets
PUB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $PUB1 --tags Key=Name,Value=rxpulse-public-1
aws ec2 modify-subnet-attribute --subnet-id $PUB1 --map-public-ip-on-launch

PUB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $PUB2 --tags Key=Name,Value=rxpulse-public-2
aws ec2 modify-subnet-attribute --subnet-id $PUB2 --map-public-ip-on-launch

# Web Private Subnets
WEB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $WEB1 --tags Key=Name,Value=rxpulse-web-private-1

WEB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $WEB2 --tags Key=Name,Value=rxpulse-web-private-2

# App Private Subnets
APP1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.20.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $APP1 --tags Key=Name,Value=rxpulse-app-private-1

APP2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.21.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $APP2 --tags Key=Name,Value=rxpulse-app-private-2

# DB Private Subnets
DB1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.30.0/24 --availability-zone us-east-1a --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $DB1 --tags Key=Name,Value=rxpulse-db-private-1

DB2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.31.0/24 --availability-zone us-east-1b --output text --query 'Subnet.SubnetId')
aws ec2 create-tags --resources $DB2 --tags Key=Name,Value=rxpulse-db-private-2
```

---

## 3. Configuring Gateways & EIPs

We need an **Internet Gateway (IGW)** for public access and a **NAT Gateway** in the public subnet to allow private-subnet EC2 instances to pull package updates.

### Step 1: Internet Gateway Setup
```bash
# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --output text --query 'InternetGateway.InternetGatewayId')
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=rxpulse-igw

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
```

### Step 2: NAT Gateway Setup
```bash
# Allocate an Elastic IP address for the NAT Gateway
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --output text --query 'AllocationId')
aws ec2 create-tags --resources $EIP_ALLOC --tags Key=Name,Value=rxpulse-nat-eip

# Create NAT Gateway in rxpulse-public-1 subnet
NAT_GW_ID=$(aws ec2 create-nat-gateway --subnet-id $PUB1 --allocation-id $EIP_ALLOC --output text --query 'NatGateway.NatGatewayId')
aws ec2 create-tags --resources $NAT_GW_ID --tags Key=Name,Value=rxpulse-nat-gw

# Wait for NAT Gateway to become active
echo "Waiting for NAT Gateway to become active..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_ID
```

---

## 4. Route Tables & Associations

We will create two route tables:
1. **Public Route Table**: Directs traffic destined outside the VPC to the **Internet Gateway**.
2. **Private Route Table**: Directs traffic destined outside the VPC to the **NAT Gateway**.

```bash
# 1. Create Public Route Table
RT_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID --output text --query 'RouteTable.RouteTableId')
aws ec2 create-tags --resources $RT_PUB --tags Key=Name,Value=rxpulse-public-rt

# 2. Add route pointing to Internet Gateway
aws ec2 create-route --route-table-id $RT_PUB --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# 3. Associate Public Subnets with Public Route Table
aws ec2 associate-route-table --subnet-id $PUB1 --route-table-id $RT_PUB
aws ec2 associate-route-table --subnet-id $PUB2 --route-table-id $RT_PUB


# 4. Create Private Route Table
RT_PVT=$(aws ec2 create-route-table --vpc-id $VPC_ID --output text --query 'RouteTable.RouteTableId')
aws ec2 create-tags --resources $RT_PVT --tags Key=Name,Value=rxpulse-private-rt

# 5. Add route pointing to NAT Gateway
aws ec2 create-route --route-table-id $RT_PVT --destination-cidr-block 0.0.0.0/0 --gateway-id $NAT_GW_ID

# 6. Associate all Web, App, and DB Private Subnets with Private Route Table
aws ec2 associate-route-table --subnet-id $WEB1 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $WEB2 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $APP1 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $APP2 --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $DB1  --route-table-id $RT_PVT
aws ec2 associate-route-table --subnet-id $DB2  --route-table-id $RT_PVT
```

---

## 5. Security Validation Checks

Verify your networking settings by running:

```bash
# Check if public route table directs 0.0.0.0/0 to your IGW
aws ec2 describe-route-tables --route-table-ids $RT_PUB --query "RouteTables[*].Routes"

# Check if private route table directs 0.0.0.0/0 to your NAT Gateway
aws ec2 describe-route-tables --route-table-ids $RT_PVT --query "RouteTables[*].Routes"
```

Next, proceed to **[02-mongodb-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/02-mongodb-setup.md)** to configure the Database tier.
