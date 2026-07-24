#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Gemini-HMS Staging VM Provisioning Script
# Provisions Ubuntu 22.04 LTS with Docker, deploy user, and firewall rules
#
# Usage: ./provision-staging-vm.sh <VM_IP> <SSH_KEY_PUB> [DOMAIN]
# Example: ./provision-staging-vm.sh 203.0.113.10 "ssh-rsa AAAA..." staging.yourhospital.org
###############################################################################

VM_IP="${1:-}"
SSH_KEY_PUB="${2:-}"
DOMAIN="${3:-staging.hms.local}"

if [ -z "$VM_IP" ] || [ -z "$SSH_KEY_PUB" ]; then
  echo "Usage: $0 <VM_IP> <SSH_PUBLIC_KEY> [DOMAIN]" >&2
  echo "  VM_IP           - Public IP or FQDN of the staging VM" >&2
  echo "  SSH_PUBLIC_KEY  - SSH public key for deploy user" >&2
  echo "  DOMAIN          - Optional domain for staging (default: staging.hms.local)" >&2
  exit 64
fi

echo "=== Gemini-HMS Staging VM Provisioning ==="
echo "Target: ${VM_IP}"
echo "Domain: ${DOMAIN}"
echo ""

# SSH options
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Step 1: Verify SSH connectivity
echo "[1/6] Verifying SSH connectivity..."
if ! ssh ${SSH_OPTS} root@"${VM_IP}" "echo 'SSH OK'" 2>/dev/null; then
  # Try with current user if root fails
  CURRENT_USER=$(whoami)
  if ! ssh ${SSH_OPTS} "${CURRENT_USER}@${VM_IP}" "echo 'SSH OK'" 2>/dev/null; then
    echo "ERROR: Cannot connect to VM via SSH. Check IP and SSH access." >&2
    exit 1
  fi
  SSH_USER="${CURRENT_USER}"
  echo "Connected as: ${SSH_USER}"
else
  SSH_USER="root"
  echo "Connected as: root"
fi

# Step 2: Update system packages
echo "[2/6] Updating system packages..."
ssh ${SSH_OPTS} "${SSH_USER}@${VM_IP}" <<'REMOTE_EOF'
set -e
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
apt-get install -y curl wget git rsync htop ufw jq
REMOTE_EOF
echo "System updated."

# Step 3: Install Docker Engine 24+ and Docker Compose plugin
echo "[3/6] Installing Docker Engine and Docker Compose..."
ssh ${SSH_OPTS} "${SSH_USER}@${VM_IP}" <<'REMOTE_EOF'
set -e

# Remove old Docker if present
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  apt-get remove -y "$pkg" 2>/dev/null || true
done

# Install Docker official repo
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
systemctl enable docker
systemctl start docker

# Install docker compose symlink for backward compatibility
ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
REMOTE_EOF
echo "Docker installed."

# Step 4: Create deploy user and configure SSH
echo "[4/6] Creating deploy user and configuring SSH access..."
ssh ${SSH_OPTS} "${SSH_USER}@${VM_IP}" <<REMOTE_EOF
set -e

# Create deploy user if not exists
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash -G docker deploy
fi

# Set up SSH directory
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Add provided public key
echo "${SSH_KEY_PUB}" > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Allow passwordless sudo for deploy user
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy

# Verify deploy user can run docker
su - deploy -c "docker info" &>/dev/null || true
REMOTE_EOF
echo "Deploy user configured."

# Step 5: Configure firewall (UFW)
echo "[5/6] Configuring firewall rules..."
ssh ${SSH_OPTS} "${SSH_USER}@${VM_IP}" <<'REMOTE_EOF'
set -e

# Reset UFW to default
ufw --force reset

# Default deny all incoming
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Block database and Redis from public access (explicit deny)
ufw deny 5432/tcp comment 'PostgreSQL - internal only'
ufw deny 6379/tcp comment 'Redis - internal only'

# Enable UFW
ufw --force enable

# Show status
ufw status verbose
REMOTE_EOF
echo "Firewall configured."

# Step 6: Create staging directories and verify
echo "[6/6] Creating staging directories and running final verification..."
ssh ${SSH_OPTS} "${SSH_USER}@${VM_IP}" <<'REMOTE_EOF'
set -e

# Create app directories
mkdir -p /home/deploy/app/releases
mkdir -p /home/deploy/app/shared
chown -R deploy:deploy /home/deploy/app

# Verify Docker is running
docker info &>/dev/null || { echo "Docker not running!"; exit 1; }

# Verify deploy user
id deploy
groups deploy

# Verify firewall
ufw status | grep -E "22/tcp|80/tcp|443/tcp" || { echo "Firewall rules missing!"; exit 1; }

# Verify blocked ports
ufw status | grep -E "5432|6379" || true

echo ""
echo "=== VM Provisioning Complete ==="
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"
echo "Deploy user: deploy (in docker group)"
echo "Firewall: SSH(22), HTTP(80), HTTPS(443) open; PostgreSQL(5432), Redis(6379) blocked"
REMOTE_EOF

echo ""
echo "=== Provisioning Complete ==="
echo "VM IP: ${VM_IP}"
echo "Domain: ${DOMAIN}"
echo "SSH: ssh deploy@${VM_IP}"
echo ""
echo "Next steps:"
echo "1. Generate secrets using: ./scripts/generate-staging-secrets.sh ${DOMAIN}"
echo "2. Add secrets to GitHub Environment 'Staging'"
echo "3. Trigger deploy: .github/workflows/deploy-staging.yml"
