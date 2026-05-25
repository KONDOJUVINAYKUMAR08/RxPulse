# RxPulse AWS EC2 Deployment Guide — 08 Security Architecture & Hardening

This guide outlines security practices applied to the **RxPulse** architecture, including AWS Security Groups, IAM Roles, and OS-level instance hardening.

---

## 1. Zero-Trust Security Groups Design

Traffic is restricted between layers. Each tier permits traffic *only* from the layer directly preceding it, utilizing Security Group IDs as sources rather than broad IP ranges.

```
Internet (0.0.0.0/0)
       │ HTTP/HTTPS
       ▼
[ Public ALB SG: rxpulse-pub-alb-sg ]
       │ Port 80 (HTTP)
       ▼
[ Frontend Web SG: rxpulse-web-sg ]
       │ Port 80 (HTTP)
       ▼
[ Internal ALB SG: rxpulse-int-alb-sg ]
       │ Ports 3001-3003
       ▼
[ Backend App SG: rxpulse-app-sg ]
       │ Port 27017 (MongoDB)
       ▼
[ Database SG: rxpulse-db-sg ]
```

### Detailed Rules Matrix:

| Security Group Name | Inbound Protocol & Port | Source (Traffic Allowed From) | Purpose |
| :--- | :--- | :--- | :--- |
| **`rxpulse-pub-alb-sg`** | TCP `80` (HTTP)<br>TCP `443` (HTTPS) | `0.0.0.0/0`<br>`0.0.0.0/0` | Public Internet traffic to Load Balancer |
| **`rxpulse-bastion-sg`** | TCP `22` (SSH) | `YOUR_ADMIN_IP/32` | Bastion access limited to admin IP |
| **`rxpulse-web-sg`** | TCP `80` (HTTP)<br>TCP `22` (SSH) | `rxpulse-pub-alb-sg`<br>`rxpulse-bastion-sg` | NGINX access from Public ALB & SSH from Bastion |
| **`rxpulse-int-alb-sg`**| TCP `80` (HTTP) | `rxpulse-web-sg` | Private backend routing from Web Tier only |
| **`rxpulse-app-sg`** | TCP `3001` - `3003`<br>TCP `22` (SSH) | `rxpulse-int-alb-sg`<br>`rxpulse-bastion-sg` | PM2 access from Internal ALB & SSH from Bastion |
| **`rxpulse-db-sg`** | TCP `27017` (MongoDB)<br>TCP `22` (SSH) | `rxpulse-app-sg`<br>`rxpulse-bastion-sg` | MongoDB access from App Tier & SSH from Bastion |

---

## 2. IAM Roles & Instance Profiles

Always follow the **Principle of Least Privilege**.

### EC2 CloudWatch Agent Role (`rxpulse-cloudwatch-role`)
Create an IAM Role with the trust policy for **EC2** and attach the AWS-managed policy:
- **`CloudWatchAgentServerPolicy`**

This role allows EC2 instances to write custom system logs, CPU/Memory metrics, and PM2 logs into AWS CloudWatch Logs.

### EC2 Deployer S3 Role (`rxpulse-s3-deploy-role`)
If code artifacts or env files are stored in S3, attach a read-only policy:
- **`AmazonS3ReadOnlyAccess`**

Attach these roles as **Instance Profiles** to their respective EC2 instances or Launch Templates.

---

## 3. Operating System Hardening

Apply the following configurations to all EC2 instances:

### 3.1 Lock Down SSH Access (SSH Hardening)
1. Disable passwords. Force SSH key-pair authentication.
2. Disable root SSH login.
3. Configure idle session timeouts to terminate inactive ssh connections.

Update `/etc/ssh/sshd_config` with these lines:
```ini
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ClientAliveInterval 300
ClientAliveCountMax 2
```
Restart SSH daemon:
```bash
sudo systemctl restart sshd
```

### 3.2 Automated Security Patches
Install `dnf-automatic` to keep the instances updated with critical CVE security patches:
```bash
sudo dnf install -y dnf-automatic
sudo sed -i 's/upgrade_type = default/upgrade_type = security/g' /etc/dnf/automatic.conf
sudo sed -i 's/apply_updates = no/apply_updates = yes/g' /etc/dnf/automatic.conf
sudo systemctl enable dnf-automatic.timer --now
```

---

## 4. HTTPS Configuration & SSL Ciphers

For optimal web transmission security:
1. Ensure the Public ALB TLS listener is set to port `443` with an ACM certificate.
2. Use the **`ELBSecurityPolicy-TLS13-1-2-2021-06`** policy on ALB, disabling older TLS 1.0 and 1.1 protocols.
3. Configure NGINX HTTP response security headers in `/etc/nginx/conf.d/rxpulse.conf`:
   ```nginx
   # Clickjacking protection
   add_header X-Frame-Options "SAMEORIGIN" always;
   # MIME-type sniffing protection
   add_header X-Content-Type-Options "nosniff" always;
   # XSS filter protection
   add_header X-XSS-Protection "1; mode=block" always;
   # Strict Transport Security (HSTS)
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
   ```

Next, proceed to **[09-troubleshooting.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/09-troubleshooting.md)** for administrative and diagnostic commands.
