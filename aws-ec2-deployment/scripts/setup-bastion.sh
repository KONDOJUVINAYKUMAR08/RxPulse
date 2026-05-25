#!/bin/bash
# ==============================================================================
# RxPulse Bastion Host Setup Script (Amazon Linux 2023)
# ==============================================================================
# Run this script with root privileges (sudo) on the Bastion EC2 instance.
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Log setup output
LOG_FILE="/var/log/rxpulse-bastion-setup.log"
exec > >(tee -i "$LOG_FILE") 2>&1

echo "===================================================================="
echo "Starting RxPulse Bastion Host Provisioning on $(date)"
echo "===================================================================="

# Verify we are running as root
if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (sudo)."
  exit 1
fi

# 1. Update OS packages
echo "[+] Updating system packages..."
dnf update -y

# 2. Install useful networking and debugging tools
echo "[+] Installing administrative utilities..."
dnf install -y tmux git telnet nc htop tcpdump

# 3. Install MongoDB Shell (mongosh) for database diagnostics
echo "[+] Adding MongoDB repository for mongosh..."
cat <<EOF > /etc/yum.repos.d/mongodb-org-6.0.repo
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-6.0.asc
EOF
dnf install -y mongodb-mongosh

# 4. Enable automatic security updates (dnf-automatic)
echo "[+] Installing and configuring dnf-automatic for security patches..."
dnf install -y dnf-automatic

# Modify dnf-automatic configuration to apply security updates automatically
sed -i 's/upgrade_type = default/upgrade_type = security/g' /etc/dnf/automatic.conf
sed -i 's/apply_updates = no/apply_updates = yes/g' /etc/dnf/automatic.conf

# Enable and start the timer
systemctl enable dnf-automatic.timer --now

# 5. Harden SSH Daemon Configuration
echo "[+] Hardening SSH Configuration..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Backup original config
cp "$SSHD_CONFIG" "${SSHD_CONFIG}.bak"

# Apply hardening settings
# - Disable Password Authentication (force SSH keys)
# - Disable Root Login
# - Set Client Alive Interval (idle timeout after 10 mins)
# - Limit max authentication attempts
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/g' "$SSHD_CONFIG"
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/g' "$SSHD_CONFIG"
sed -i 's/^#PermitRootLogin yes/PermitRootLogin no/g' "$SSHD_CONFIG"
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/g' "$SSHD_CONFIG"

# Add timeout configurations if not present
if ! grep -q "ClientAliveInterval" "$SSHD_CONFIG"; then
  echo "ClientAliveInterval 600" >> "$SSHD_CONFIG"
  echo "ClientAliveCountMax 0" >> "$SSHD_CONFIG"
fi

# Restart SSH service to apply changes
echo "[+] Restarting SSH service..."
systemctl restart sshd

# 6. Create ssh helper script for jumping to private instances
echo "[+] Creating SSH jump helper script in /usr/local/bin/ssh-jump..."
cat <<'EOF' > /usr/local/bin/ssh-jump
#!/bin/bash
# Helper to SSH from Bastion to private subnet instances using agent forwarding
# Usage: ssh-jump <private-ip-or-dns> [user]

IP=$1
USER=${2:-"ec2-user"}

if [ -z "$IP" ]; then
  echo "Usage: ssh-jump <private-ip-or-dns> [user]"
  exit 1
fi

echo "[+] Jumping to $USER@$IP..."
ssh -o StrictHostKeyChecking=no "$USER@$IP"
EOF
chmod +x /usr/local/bin/ssh-jump

echo "===================================================================="
echo "[+] RxPulse Bastion Host setup completed successfully!"
echo "    Check logs at: $LOG_FILE"
echo "===================================================================="
