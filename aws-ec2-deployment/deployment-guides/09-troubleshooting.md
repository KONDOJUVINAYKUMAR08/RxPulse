# RxPulse AWS EC2 Deployment Guide — 09 Troubleshooting

This guide provides troubleshooting steps, diagnostic commands, log locations, and resolution steps for common deployment issues on the **RxPulse** AWS EC2 architecture.

---

## 1. Important Log File Locations

When debugging, always inspect logs first.

| Component | Log Path | View Command |
| :--- | :--- | :--- |
| **MongoDB Service** | `/var/log/mongodb/mongod.log` | `sudo tail -n 100 -f /var/log/mongodb/mongod.log` |
| **NGINX Access Log** | `/var/log/nginx/access.log` | `sudo tail -n 100 -f /var/log/nginx/access.log` |
| **NGINX Error Log** | `/var/log/nginx/error.log` | `sudo tail -n 100 -f /var/log/nginx/error.log` |
| **PM2 (All apps)** | `/home/rxpulse/.pm2/logs/` | `sudo -u rxpulse pm2 logs` |
| **user-service Out/Err**| `/var/log/rxpulse/user-service-error.log` | `tail -n 100 -f /var/log/rxpulse/user-service-error.log` |
| **catalog-service Out/Err**| `/var/log/rxpulse/catalog-service-error.log` | `tail -n 100 -f /var/log/rxpulse/catalog-service-error.log` |
| **inventory-service Out/Err**| `/var/log/rxpulse/inventory-service-error.log`| `tail -n 100 -f /var/log/rxpulse/inventory-service-error.log`|
| **EC2 User-Data Log**| `/var/log/user-data.log` | `sudo tail -n 100 -f /var/log/user-data.log` |

---

## 2. Common Scenarios and Resolutions

### Scenario A: NGINX Returns "502 Bad Gateway"
- **Symptom**: Browsing to `/api/...` endpoints results in an HTTP 502 error page.
- **Root Causes**:
  1. The Internal ALB is unreachable or its target groups are unhealthy.
  2. The PM2 backend services on the App EC2 instances are stopped.
  3. The proxy URL in `/etc/nginx/conf.d/rxpulse.conf` is pointing to the wrong Internal ALB DNS name.
- **Resolution Steps**:
  1. SSH to the Web EC2 instance, test NGINX config syntax: `sudo nginx -t`.
  2. Perform name resolution check for the Internal ALB DNS: `nslookup <INTERNAL_ALB_DNS>`.
  3. Check if PM2 apps are online on the Backend EC2: `sudo -u rxpulse pm2 status`.
  4. Manually curl the backend service ports directly from the Web EC2 to check network connectivity:
     `curl -I http://<BACKEND_APP_PRIVATE_IP>:3001/health`.

### Scenario B: PM2 Backend Apps Keep Restarting
- **Symptom**: `pm2 status` shows a high restart count and services are repeatedly cycling.
- **Root Causes**:
  1. The Node.js application is failing to connect to MongoDB (causing mongoose to throw an unhandled error).
  2. JWT_SECRET is missing or mismatching in `.env` files.
  3. Port conflict (port 3001, 3002, or 3003 is already occupied).
- **Resolution Steps**:
  1. Check PM2 logs: `sudo -u rxpulse pm2 logs <service-name>`.
  2. Check MongoDB connectivity from the App EC2:
     `nc -z -w3 <MONGODB_PRIVATE_IP> 27017` or
     `mongosh --host <MONGODB_PRIVATE_IP> -u admin -p "Password"`
  3. Verify `.env` file exists and is populated in `/opt/rxpulse/<service-name>/.env`.

### Scenario C: MongoDB Connection Timeout
- **Symptom**: Node.js logs show database timeout errors: `MongooseError: Operation timeout...`
- **Root Causes**:
  1. Security Group block: `rxpulse-db-sg` is not allowing inbound port `27017` from `rxpulse-app-sg`.
  2. MongoDB is not bound to the correct private IP address in `/etc/mongod.conf`.
  3. MongoDB daemon is not running.
- **Resolution Steps**:
  1. Verify MongoDB service status: `sudo systemctl status mongod`.
  2. Verify bind IP list in `/etc/mongod.conf`:
     `net.bindIp` must include the instance's private IP.
  3. Inspect DB security group rules to verify it permits SG-to-SG access.

### Scenario D: ALB Target Group Shows "Unhealthy" Hosts
- **Symptom**: ALB console marks instances as `unhealthy`, resulting in 503 Service Unavailable errors.
- **Root Causes**:
  1. The health check path is misconfigured (must be `/health` returning 200).
  2. Port configuration in target group does not match actual application ports.
  3. The service on the target instance is not running or listening.
- **Resolution Steps**:
  1. Run a local query to check the health status: `curl -I http://localhost:3001/health`.
  2. Verify ALB target group configuration settings: Health check port, path (`/health`), and threshold timers.
  3. Increase the health check grace period in Auto Scaling Groups to 300 seconds to allow User-Data bootstrap scripts to finish installing packages.

---

## 3. Essential Troubleshooting Commands

### Process and Ports Check
```bash
# Check if services are listening on specific ports
sudo ss -tulpn | grep -E '80|3001|3002|3003|27017'

# Check system memory usage
free -h

# Check CPU usage per process
htop
```

### Network and Security Group Check
```bash
# Check if ports are open on a remote host (run from Bastion/Web/App)
nc -z -w5 <TARGET_IP> <PORT>

# Perform HTTP request validation
curl -iv http://<TARGET_IP>:<PORT>/health
```

### PM2 Specific Commands
```bash
# Monitor PM2 resources and CPU logs in real-time
sudo -u rxpulse pm2 monit

# Reload all apps gracefully (zero downtime)
sudo -u rxpulse pm2 reload all

# Clean PM2 process dump list
sudo -u rxpulse pm2 clear
```
