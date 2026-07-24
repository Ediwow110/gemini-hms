#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Gemini-HMS Staging Quick-Start Script
# End-to-end staging provisioning, secrets generation, and deployment trigger
#
# Usage: ./staging-quickstart.sh <VM_IP> <DOMAIN> [SSH_PUB_KEY_FILE]
# Example: ./staging-quickstart.sh 203.0.113.10 staging.yourhospital.org
###############################################################################

VM_IP="${1:-}"
DOMAIN="${2:-}"
SSH_PUB_KEY_FILE="${3:-}"

if [ -z "$VM_IP" ] || [ -z "$DOMAIN" ]; then
  echo "=== Gemini-HMS Staging Quick-Start ===" >&2
  echo "" >&2
  echo "Usage: $0 <VM_IP> <DOMAIN> [SSH_PUB_KEY_FILE]" >&2
  echo "" >&2
  echo "Arguments:" >&2
  echo "  VM_IP             - Public IP address of your provisioned Ubuntu 22.04 VM" >&2
  echo "  DOMAIN            - Staging domain (e.g., staging.yourhospital.org)" >&2
  echo "  SSH_PUB_KEY_FILE  - Optional: Path to SSH public key file (default: generate new)" >&2
  echo "" >&2
  echo "Prerequisites:" >&2
  echo "  1. Ubuntu 22.04 VM provisioned (2 vCPU, 4GB RAM, 40GB SSD)" >&2
  echo "  2. SSH access as root or user with sudo" >&2
  echo "  3. Firewall ports 22, 80, 443 open; 5432, 6379 blocked" >&2
  echo "  4. GitHub repository admin access" >&2
  echo "" >&2
  exit 64
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

echo "=== Gemini-HMS Staging Quick-Start ==="
echo "VM IP:    ${VM_IP}"
echo "Domain:   ${DOMAIN}"
echo "Time:     ${TIMESTAMP}"
echo ""

# Check prerequisites
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Checking prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

command -v ssh &>/dev/null || { echo "ERROR: ssh not found"; exit 1; }
command -v curl &>/dev/null || { echo "ERROR: curl not found"; exit 1; }
command -v openssl &>/dev/null || { echo "ERROR: openssl not found"; exit 1; }
command -v gh &>/dev/null || echo "WARN: gh (GitHub CLI) not found - will use web UI for workflow trigger"

# Generate or use provided SSH key
if [ -n "$SSH_PUB_KEY_FILE" ] && [ -f "$SSH_PUB_KEY_FILE" ]; then
  SSH_PUB_KEY="$(cat "$SSH_PUB_KEY_FILE")"
  SSH_PRIV_KEY="${SSH_PUB_KEY_FILE%.pub}"
  echo "Using existing SSH key: ${SSH_PUB_KEY_FILE}"
else
  echo "Generating new SSH key pair for deployment..."
  SSH_PRIV_KEY="/tmp/hms_staging_deploy_${TIMESTAMP}"
  SSH_PUB_KEY_FILE="${SSH_PRIV_KEY}.pub"
  ssh-keygen -t ed25519 -f "${SSH_PRIV_KEY}" -N "" -C "github-actions-staging-${TIMESTAMP}" -q
  SSH_PUB_KEY="$(cat "${SSH_PUB_KEY_FILE}")"
  echo "SSH key generated: ${SSH_PUB_KEY_FILE}"
fi

echo ""

# Step 1: Provision VM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Provisioning VM with Docker, deploy user, firewall"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

chmod +x "${SCRIPT_DIR}/provision-staging-vm.sh"
"${SCRIPT_DIR}/provision-staging-vm.sh" "${VM_IP}" "${SSH_PUB_KEY}" "${DOMAIN}"

echo ""

# Step 2: Generate secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Generating staging secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

chmod +x "${SCRIPT_DIR}/generate-staging-secrets.sh"
SECRETS_OUTPUT="/tmp/hms_staging_secrets_${TIMESTAMP}.txt"
"${SCRIPT_DIR}/generate-staging-secrets.sh" "${DOMAIN}" > "${SECRETS_OUTPUT}"

echo "Secrets saved to: ${SECRETS_OUTPUT}"
echo ""
echo "IMPORTANT: Review and securely store the secrets file!"
echo "You will need these values for GitHub Environment secrets."
echo ""

# Extract key values for display
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Key values for GitHub Environment 'Staging':"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "^STAGING_(SSH_HOST|SSH_USER|SSH_PORT|POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB|DATABASE_URL|JWT_SECRET|MASTER_MFA_KEY|CORS_ORIGINS)=" "${SECRETS_OUTPUT}" | head -15 || true
echo ""

# Step 3: Instructions for GitHub setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: GitHub Environment Setup (MANUAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://github.com/Ediwow110/gemini-hms/settings/environments"
echo "2. Click 'New environment' → Name: 'Staging'"
echo "3. Add the secrets from: ${SECRETS_OUTPUT}"
echo ""
echo "Required secrets (11):"
echo "  - STAGING_SSH_HOST=${VM_IP}"
echo "  - STAGING_SSH_USER=deploy"
echo "  - STAGING_SSH_PRIVATE_KEY=<from ${SSH_PRIV_KEY}>"
echo "  - STAGING_SSH_PORT=22"
echo "  - STAGING_POSTGRES_USER=hms_staging_user"
echo "  - STAGING_POSTGRES_PASSWORD=<from secrets file>"
echo "  - STAGING_POSTGRES_DB=gemini_hms_staging"
echo "  - STAGING_DATABASE_URL=<from secrets file>"
echo "  - STAGING_JWT_SECRET=<from secrets file>"
echo "  - STAGING_MASTER_MFA_KEY=<from secrets file>"
echo "  - STAGING_CORS_ORIGINS=https://${DOMAIN},http://localhost:5173"
echo ""

# Step 4: Add SSH key to VM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Adding SSH key to VM deploy user"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@"${VM_IP}" "
  mkdir -p /home/deploy/.ssh &&
  echo '${SSH_PUB_KEY}' >> /home/deploy/.ssh/authorized_keys &&
  chown -R deploy:deploy /home/deploy/.ssh &&
  chmod 700 /home/deploy/.ssh &&
  chmod 600 /home/deploy/.ssh/authorized_keys
" 2>/dev/null || {
  echo "WARN: Could not auto-add SSH key. Please run manually:"
  echo "  ssh root@${VM_IP} \"echo '${SSH_PUB_KEY}' >> /home/deploy/.ssh/authorized_keys\""
}

echo ""

# Step 5: Verify deployment (after user triggers workflow)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Trigger Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After adding secrets to GitHub, trigger the deployment:"
echo ""

if command -v gh &>/dev/null; then
  echo "  gh workflow run deploy-staging.yml --ref main"
else
  echo "  Go to: https://github.com/Ediwow110/gemini-hms/actions/workflows/deploy-staging.yml"
  echo "  Click 'Run workflow' → Select branch 'main' → 'Run workflow'"
fi

echo ""
echo "Then run verification:"
echo "  chmod +x ${SCRIPT_DIR}/verify-staging-deployment.sh"
echo "  ${SCRIPT_DIR}/verify-staging-deployment.sh ${DOMAIN}"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "QUICK-START SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "VM IP:           ${VM_IP}"
echo "Domain:          ${DOMAIN}"
echo "SSH Key:         ${SSH_PUB_KEY_FILE}"
echo "Secrets File:    ${SECRETS_OUTPUT}"
echo ""
echo "Next actions:"
echo "  1. [DONE] VM provisioned with Docker"
echo "  2. [DONE] Secrets generated"
echo "  3. [MANUAL] Add secrets to GitHub Environment 'Staging'"
echo "  4. [MANUAL] Trigger deploy-staging.yml workflow"
echo "  5. [AUTO] Run verify-staging-deployment.sh after workflow completes"
echo ""
echo "Staging URLs (after deployment):"
echo "  Frontend: http://${DOMAIN}/"
echo "  API:      http://${DOMAIN}/api/v1/health"
echo ""
