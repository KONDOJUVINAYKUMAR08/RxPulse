# RxPulse AWS EC2 Deployment Guide — 02 MongoDB Setup

This guide walks you through provisioning a secure, standalone MongoDB 6.0 instance on an Amazon Linux 2023 EC2 instance in the Private DB Subnet (`10.0.30.0/24`).

---

## 1. Prerequisites & EC2 Launch Configuration

Ensure the MongoDB EC2 is launched with the following configurations:
- **AMI**: Amazon Linux 2023
- **Instance Type**: `t3.small` (minimum 2GB RAM required for stable MongoDB operations)
- **Subnet**: `rxpulse-db-private-1` (`10.0.30.x`)
- **Public IP**: Disabled (Assign Private IP only)
- **Security Group**: `rxpulse-db-sg` (Allows port `27017` inbound from `rxpulse-app-sg` and port `22` inbound from `rxpulse-bastion-sg`)
- **Storage**: EBS Volume GP3, minimum 20GB.

---

## 2. Installation Steps

SSH into the Bastion Host, and then SSH jump into the private MongoDB instance:

```bash
# Jump from Bastion to MongoDB instance
ssh-jump <MONGODB_PRIVATE_IP>
```

Run the following commands as root to set up the official MongoDB 6.0 repository and install:

```bash
# 1. Update OS packages
sudo dnf update -y

# 2. Add MongoDB repository configuration
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo <<EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-6.0.asc
EOF

# 3. Install MongoDB package
sudo dnf install -y mongodb-org
```

---

## 3. Configuration & Bootstrapping Access Control

MongoDB requires a multi-step bootstrap process to enable security features without lock-outs.

### Step 1: Configure Bind IP & Disable Auth Initially
Open `/etc/mongod.conf` and update the `net` configuration. You must bind to localhost and the private IP of the EC2 instance. Ensure `security.authorization` is disabled initially:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1,<MONGODB_PRIVATE_IP>

security:
  authorization: disabled
```

Start the MongoDB daemon:
```bash
sudo systemctl enable mongod --now
```

### Step 2: Initialize Databases and Users
Launch the MongoDB Shell (`mongosh`) on the instance:
```bash
mongosh
```

Run the following commands to create the root administrator and application-specific credentials:

```javascript
// Switch to admin database and create root user
use admin
db.createUser({
  user: "admin",
  pwd: "AdminSecurePassword123!", // Replace with a strong password
  roles: [ { role: "root", db: "admin" } ]
})

// Create user-service database and readWrite user
use users_db
db.createUser({
  user: "user_service_user",
  pwd: "UserSecurePassword123!", // Replace with a strong password
  roles: [ { role: "readWrite", db: "users_db" } ]
})

// Create catalog-service database and readWrite user
use catalog_db
db.createUser({
  user: "catalog_service_user",
  pwd: "CatalogSecurePassword123!", // Replace with a strong password
  roles: [ { role: "readWrite", db: "catalog_db" } ]
})

// Create inventory-service database and readWrite user
use inventory_db
db.createUser({
  user: "inventory_service_user",
  pwd: "InventorySecurePassword123!", // Replace with a strong password
  roles: [ { role: "readWrite", db: "inventory_db" } ]
})

exit
```

### Step 3: Generate Security Keyfile & Enable Access Control
A security keyfile is required for authentication in replica sets and secures internal communication.

```bash
# Generate keyfile
sudo openssl rand -base64 756 | sudo tee /var/lib/mongo/rxpulse-keyfile > /dev/null
sudo chmod 400 /var/lib/mongo/rxpulse-keyfile
sudo chown mongod:mongod /var/lib/mongo/rxpulse-keyfile
```

Modify `/etc/mongod.conf` to enable access control and specify the keyfile:

```yaml
security:
  authorization: enabled
  keyFile: /var/lib/mongo/rxpulse-keyfile
```

Restart MongoDB to apply the security settings:
```bash
sudo systemctl restart mongod
```

Test your admin connection:
```bash
mongosh -u admin -p "AdminSecurePassword123!" --authenticationDatabase admin
```

---

## 4. Seeding Initial Data

Because the database is isolated inside the private database subnet and seed scripts are written in Node.js, **you must execute the seeding from the backend app servers**, which can connect to MongoDB.

1. Once the Backend EC2 instances are provisioned (see next guide), copy the `seed-all.sh` script to the backend app server.
2. Run the script:
   ```bash
   chmod +x /opt/rxpulse/seed-all.sh
   sudo ./seed-all.sh
   ```

---

## 5. Automating Backups

To automate backups, configure a cron job to run the provided backup script daily.

1. Copy `backup.sh` to `/opt/mongodb/backup.sh` on the MongoDB EC2.
2. Edit `/opt/mongodb/backup.sh` to supply the actual admin password and (optional) S3 bucket URL.
3. Make the script executable:
   ```bash
   sudo chmod +x /opt/mongodb/backup.sh
   ```
4. Create a daily cron job:
   ```bash
   sudo crontab -e
   ```
   Add the following line to run backups at 2 AM every day:
   ```cron
   0 2 * * * /opt/mongodb/backup.sh >> /var/log/mongodb-backup.log 2>&1
   ```

To restore from a backup tarball, run the restore script:
```bash
sudo ./restore.sh /backups/mongodb/rxpulse_backup_YYYYMMDD_HHMMSS.tar.gz "AdminSecurePassword123!"
```

Next, proceed to **[03-backend-setup.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/03-backend-setup.md)** to configure the Backend App tier.
