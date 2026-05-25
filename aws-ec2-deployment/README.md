# RxPulse AWS EC2 Deployment Entrypoint

Welcome to the **RxPulse AWS EC2 Deployment** suite. This directory contains all the automation scripts, configurations, and step-by-step guides needed to deploy the RxPulse application onto a secure, multi-AZ, 3-tier AWS architecture without containers.

---

## 🚀 Step-by-Step Deployment Roadmap

Follow this exact sequence to deploy the entire stack:

| Step | Action | Guided Document | Key Scripts Involved |
| :--- | :--- | :--- | :--- |
| **1** | Set up VPC, subnets, NAT, and route tables | 📄 **[01-aws-infrastructure.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/01-aws-infrastructure.md)** | *AWS CLI or Console* |
| **2** | Deploy and secure the MongoDB database server | 📄 **[02-mongodb-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/02-mongodb-setup.md)** | ⚙️ `mongodb/setup-mongodb.sh`<br>⚙️ `mongodb/mongod.conf` |
| **3** | Deploy the Node.js backend services via PM2 | 📄 **[03-backend-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/03-backend-setup.md)** | ⚙️ `scripts/setup-backend-ec2.sh`<br>⚙️ `backend/ecosystem.config.js`<br>⚙️ `systemd/rxpulse-backend.service` |
| **4** | Seed database collections with production sample data | 📄 **[02-mongodb-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/02-mongodb-setup.md#4-seeding-initial-data)** | ⚙️ `mongodb/seed-all.sh` |
| **5** | Deploy the NGINX frontend web server and React SPA | 📄 **[04-frontend-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/04-frontend-setup.md)** | ⚙️ `scripts/setup-frontend-ec2.sh`<br>⚙️ `frontend/nginx/rxpulse.conf` |
| **6** | Configure Public and Internal Load Balancers | 📄 **[05-alb-routing.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/05-alb-routing.md)** | *AWS CLI target groups and routing rules* |
| **7** | Attach custom Domain DNS and secure HTTPS/SSL certificates | 📄 **[06-route53-ssl.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/06-route53-ssl.md)** | *Route53 and AWS Certificate Manager* |
| **8** | Configure Auto Scaling Groups and Launch Templates | 📄 **[07-auto-scaling.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/07-auto-scaling.md)** | *Auto-scaling target-tracking policies* |
| **9** | Perform server hardening, secure SSH, and IAM security checks | 📄 **[08-security.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/08-security.md)** | ⚙️ `scripts/setup-bastion.sh` |
| **10** | Perform final end-to-end service connection tests | 📄 **[09-troubleshooting.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/09-troubleshooting.md)** | ⚙️ `scripts/health-check.sh` |

---

## ⚡ Fast-Track Deployment (Runbook)

For administrators who want a copy-paste command sheet for the entire process, skip the guides and open the main runbook:

👉 **[deployment-runbook.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/runbook/deployment-runbook.md)**

---

## 🛠️ Diagnostics & Maintenance Tasks

- **Daily Backups**: Configure database backups to automatically run on a schedule using `mongodb/backup.sh`.
- **Restores**: Recover your database databases from a compressed backup archive with `mongodb/restore.sh`.
- **Code Updates**: Deploy local front-end updates directly to your private web instances via Bastion proxying using `frontend/deploy.sh`.
- **System Diagnosis**: Check local process states, ports, and logs at any time with `scripts/health-check.sh`.
