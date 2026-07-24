#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Gemini-HMS Staging Secrets Generator
# Generates all 11+ required secrets for GitHub Environment 'Staging'
#
# Usage: ./generate-staging-secrets.sh [DOMAIN]
# Output: Prints export commands and GitHub Actions secret format
###############################################################################

DOMAIN="${1:-staging.hms.local}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

echo "=== Gemini-HMS Staging Secrets Generator ==="
echo "Domain: ${DOMAIN}"
echo "Generated: ${TIMESTAMP}"
echo ""

# Helper: Generate cryptographically secure random string
generate_secret() {
  local length="${1:-32}"
  openssl rand -hex "$length"
}

# Helper: Generate URL-safe base64 secret
generate_b64_secret() {
  local length="${1:-32}"
  openssl rand -base64 "$length" | tr -dc 'a-zA-Z0-9' | head -c 64
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. SSH ACCESS SECRETS (for GitHub Actions → VM)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate SSH key pair for GitHub Actions deployment
SSH_KEY_FILE="/tmp/hms_staging_deploy_key_${TIMESTAMP}"
ssh-keygen -t ed25519 -f "${SSH_KEY_FILE}" -N "" -C "github-actions-staging-deploy" -q
SSH_PRIVATE_KEY="$(cat "${SSH_KEY_FILE}")"
SSH_PUBLIC_KEY="$(cat "${SSH_KEY_FILE}.pub")"

echo "STAGING_SSH_PRIVATE_KEY="
echo "${SSH_PRIVATE_KEY}"
echo ""
echo "STAGING_SSH_PUBLIC_KEY (add to VM deploy user authorized_keys):"
echo "${SSH_PUBLIC_KEY}"
echo ""

# Default SSH connection values
echo "STAGING_SSH_HOST=<VM_IP_OR_FQDN>  # e.g., ${DOMAIN} or 203.0.113.10"
echo "STAGING_SSH_USER=deploy"
echo "STAGING_SSH_PORT=22"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. DATABASE SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STAGING_POSTGRES_USER="hms_staging_user"
STAGING_POSTGRES_PASSWORD="$(generate_secret 32)"
STAGING_POSTGRES_DB="gemini_hms_staging"

echo "STAGING_POSTGRES_USER=${STAGING_POSTGRES_USER}"
echo "STAGING_POSTGRES_PASSWORD=${STAGING_POSTGRES_PASSWORD}"
echo "STAGING_POSTGRES_DB=${STAGING_POSTGRES_DB}"
echo ""

# Full DATABASE_URL for container-to-container communication
STAGING_DATABASE_URL="postgresql://${STAGING_POSTGRES_USER}:${STAGING_POSTGRES_PASSWORD}@db:5432/${STAGING_POSTGRES_DB}?schema=public"
echo "STAGING_DATABASE_URL=${STAGING_DATABASE_URL}"
echo ""

# Docker compose DB vars (used by docker-compose.staging.yml)
echo "# Docker Compose DB configuration:"
echo "STAGING_DB_USER=${STAGING_POSTGRES_USER}"
echo "STAGING_DB_PASSWORD=${STAGING_POSTGRES_PASSWORD}"
echo "STAGING_DB_NAME=${STAGING_POSTGRES_DB}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. APPLICATION SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "STAGING_JWT_SECRET=$(generate_secret 32)"
echo "STAGING_JWT_REFRESH_SECRET=$(generate_secret 32)"
echo "STAGING_MASTER_MFA_KEY=$(generate_secret 32)"
echo "STAGING_AUDIT_CHAIN_SECRET=$(generate_secret 32)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. REDIS SECRETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "# For container-to-container (Redis service name 'redis' in compose):"
echo "STAGING_REDIS_URL=redis://redis:6379"
echo "STAGING_REDIS_TLS_CA_BASE64=  # Leave empty for non-TLS internal Redis"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. CORS & NETWORK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "STAGING_CORS_ORIGINS=https://${DOMAIN},http://localhost:5173"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. NOTIFICATION PROVIDERS (required in staging - mock rejected)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "# Choose ONE email provider: 'ses' or 'mailrelay'"
echo "STAGING_EMAIL_PROVIDER=ses  # or 'mailrelay'"
echo ""
echo "# If SES:"
echo "STAGING_AWS_REGION=ap-southeast-1"
echo "STAGING_SES_SENDER_EMAIL=noreply@${DOMAIN}"
echo "STAGING_AWS_ACCESS_KEY_ID=<your-aws-access-key>"
echo "STAGING_AWS_SECRET_ACCESS_KEY=<your-aws-secret>"
echo "STAGING_AWS_SESSION_TOKEN=  # Optional"
echo ""
echo "# If Mailrelay:"
echo "STAGING_MAILRELAY_SMTP_HOST=smtp.example.com"
echo "STAGING_MAILRELAY_SMTP_PORT=465"
echo "STAGING_MAILRELAY_SMTP_USER=<smtp-user>"
echo "STAGING_MAILRELAY_SMTP_PASS=<smtp-password>"
echo "STAGING_MAILRELAY_SENDER_EMAIL=noreply@${DOMAIN}"
echo "STAGING_MAILRELAY_SENDER_NAME=HMS Staging"
echo ""
echo "# SMS Provider (required: semaphore)"
echo "STAGING_SMS_PROVIDER=semaphore"
echo "STAGING_SEMAPHORE_API_KEY=<semaphore-api-key>"
echo "STAGING_SEMAPHORE_API_URL=https://api.semaphore.co/api/v4/messages"
echo "STAGING_SEMAPHORE_SENDER_NAME=HMS"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. OPTIONAL: Monitoring & Error Tracking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "STAGING_SENTRY_DSN=  # Optional: Sentry error tracking"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GITHUB ACTIONS SECRET FORMAT (copy-paste ready)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate all secrets
JWT_SECRET="$(generate_secret 32)"
JWT_REFRESH_SECRET="$(generate_secret 32)"
MASTER_MFA_KEY="$(generate_secret 32)"
AUDIT_CHAIN_SECRET="$(generate_secret 32)"

cat <<EOF
# === REQUIRED SECRETS FOR GITHUB ENVIRONMENT 'Staging' ===
# Add these to: GitHub Repo → Settings → Environments → Staging → Environment variables/secrets

STAGING_SSH_HOST=<VM_IP>
STAGING_SSH_USER=deploy
STAGING_SSH_PRIVATE_KEY=$(printf '%s' "$SSH_PRIVATE_KEY" | head -c 100)...
STAGING_SSH_PORT=22

STAGING_POSTGRES_USER=${STAGING_POSTGRES_USER}
STAGING_POSTGRES_PASSWORD=${STAGING_POSTGRES_PASSWORD}
STAGING_POSTGRES_DB=${STAGING_POSTGRES_DB}
STAGING_DATABASE_URL=${STAGING_DATABASE_URL}

STAGING_JWT_SECRET=${JWT_SECRET}
STAGING_JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
STAGING_MASTER_MFA_KEY=${MASTER_MFA_KEY}
STAGING_AUDIT_CHAIN_SECRET=${AUDIT_CHAIN_SECRET}

STAGING_REDIS_URL=redis://redis:6379
STAGING_REDIS_TLS_CA_BASE64=

STAGING_DB_USER=${STAGING_POSTGRES_USER}
STAGING_DB_PASSWORD=${STAGING_POSTGRES_PASSWORD}
STAGING_DB_NAME=${STAGING_POSTGRES_DB}

STAGING_CORS_ORIGINS=https://${DOMAIN},http://localhost:5173

STAGING_EMAIL_PROVIDER=ses
STAGING_SMS_PROVIDER=semaphore

# Provider-specific (fill in your actual credentials):
STAGING_AWS_REGION=ap-southeast-1
STAGING_SES_SENDER_EMAIL=noreply@${DOMAIN}
STAGING_AWS_ACCESS_KEY_ID=<your-key>
STAGING_AWS_SECRET_ACCESS_KEY=<your-secret>
STAGING_SEMAPHORE_API_KEY=<your-key>
STAGING_SEMAPHORE_API_URL=https://api.semaphore.co/api/v4/messages
STAGING_SEMAPHORE_SENDER_NAME=HMS
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SSH KEY FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Private key saved to: ${SSH_KEY_FILE}"
echo "Public key saved to: ${SSH_KEY_FILE}.pub"
echo ""
echo "IMPORTANT: Add the PUBLIC key to the VM:"
echo "  ssh root@<VM_IP> \"echo '${SSH_PUBLIC_KEY}' >> /home/deploy/.ssh/authorized_keys\""
echo ""
echo "Secrets generated successfully. Store them securely!"
