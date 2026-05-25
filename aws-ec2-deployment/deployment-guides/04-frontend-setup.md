# RxPulse AWS EC2 Deployment Guide — 04 Frontend Setup

This guide details how to configure the Private Web Tier instances (`rxpulse-web-private-1` and `rxpulse-web-private-2`) running **NGINX** to serve the static built React SPA and proxy API requests to the Internal ALB.

---

## 1. Instance Launch Specifications

Ensure your Frontend Web EC2 instances are launched with the following specifications:
- **AMI**: Amazon Linux 2023
- **Instance Type**: `t3.micro` (Static asset delivery is lightweight)
- **Subnets**: `rxpulse-web-private-1` and `rxpulse-web-private-2` (Private IP only)
- **Security Group**: `rxpulse-web-sg`
  - Inbound TCP `80` from `rxpulse-pub-alb-sg`
  - Inbound TCP `22` from `rxpulse-bastion-sg`
- **Public IP**: Disabled (Assign Private IP only)

---

## 2. Server Provisioning Steps

SSH jump to the private Frontend Web EC2 instance from Bastion:
```bash
ssh-jump <FRONTEND_WEB_PRIVATE_IP>
```

Execute the provisioning commands as root or run `setup-frontend-ec2.sh`:

```bash
# 1. Update system packages
sudo dnf update -y

# 2. Install Node.js 18 LTS and Git
sudo dnf module enable nodejs:18 -y || true
sudo dnf install -y nodejs git

# 3. Install NGINX
sudo dnf install -y nginx
```

---

## 3. Web Directory Structure & Permissions

Set up the standard directories where NGINX will serve files:

```bash
# Create web root
sudo mkdir -p /var/www/rxpulse/html

# Adjust directory permissions so the nginx user can read the files
sudo chown -R nginx:nginx /var/www/rxpulse
sudo chmod -R 755 /var/www/rxpulse
```

---

## 4. Building the Frontend Assets

Because the frontend is a React application built with Vite, we must bundle it into static html/js/css files.

1. Fetch or copy the source code containing the `frontend` directory to the server (e.g. at `/opt/rxpulse-src/frontend`).
2. Navigate to the frontend directory:
   ```bash
   cd /opt/rxpulse-src/frontend
   ```
3. Install dependencies and compile the production bundle:
   ```bash
   # Clean install dependencies
   sudo npm ci
   
   # Build the production bundle
   sudo npm run build
   ```
   *Note: Vite will compile output into a `dist/` directory.*
4. Copy the compiled assets into the NGINX web root folder:
   ```bash
   sudo cp -r dist/* /var/www/rxpulse/html/
   sudo chown -R nginx:nginx /var/www/rxpulse/html
   ```

---

## 5. Deploying the NGINX Configuration

We will place our customized configuration in NGINX's `conf.d` directory.

1. Copy the `rxpulse.conf` template to NGINX configuration folder:
   ```bash
   sudo cp /opt/rxpulse-src/aws-ec2-deployment/frontend/nginx/rxpulse.conf /etc/nginx/conf.d/
   ```
2. Edit `/etc/nginx/conf.d/rxpulse.conf` to replace the placeholder `<INTERNAL_ALB_DNS>` with your actual Internal ALB DNS name.
   ```nginx
   # Inside /etc/nginx/conf.d/rxpulse.conf
   location /api/users/ {
       proxy_pass http://internal-rxpulse-alb-123456789.us-east-1.elb.amazonaws.com/api/users/;
       ...
   }
   ```
3. Disable default servers in the primary configuration file `/etc/nginx/nginx.conf` if they conflict. Check for any active default `server` block on port 80 and comment it out or delete it.
4. Validate the NGINX configuration:
   ```bash
   sudo nginx -t
   ```
   *Expected output: syntax is ok, test is successful*

---

## 6. Starting and Enabling NGINX

Start the service and configure it to launch automatically on system boot:

```bash
sudo systemctl enable nginx --now
```

Verify service status:
```bash
sudo systemctl status nginx
```

### Checking Local Server Access
Test if the local server serves the page and responds to the health check:
```bash
curl -I http://localhost/health  # Expected: HTTP/1.1 200 OK
curl -s http://localhost/ | head -n 5  # Expected: <!DOCTYPE html> ...
```

Next, proceed to **[05-alb-routing.md](file:///c:/Users/Admin/Desktop/RxPulse-1/aws-ec2-deployment/deployment-guides/05-alb-routing.md)** to configure Application Load Balancers.
