#!/usr/bin/env bash
# ==============================================================================
# SRE REMOTE DEPLOYMENT & PRODUCTION CLUSTER REFRESH
# ==============================================================================
set -euo pipefail

echo "================================================================================"
echo "🚀 INITIATING CLOUD REFRESH & DEPLOYMENT"
echo "================================================================================"

# Validate target environment variables
if [ -z "${DATABASE_URL:-}" ] || [ -z "${JWT_SECRET:-}" ] || [ -z "${MASTER_MFA_KEY:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ] || [ -z "${DB_NAME:-}" ]; then
  echo "❌ CRITICAL: Missing mandatory deployment environment variables!"
  exit 1
fi

if [ -z "${EMAIL_PROVIDER:-}" ] || [ -z "${SMS_PROVIDER:-}" ]; then
  echo "❌ CRITICAL: EMAIL_PROVIDER and SMS_PROVIDER are required for production (NODE_ENV=production rejects mock providers at startup)."
  exit 1
fi

if [ "${EMAIL_PROVIDER}" = "mock" ] || [ "${SMS_PROVIDER}" = "mock" ]; then
  echo "❌ CRITICAL: mock notification providers are forbidden when NODE_ENV=production (see notification-providers.ts)."
  exit 1
fi

echo "[CD] Validating docker-compose configuration..."
docker compose -f docker-compose.prod.yml config -q || { echo "❌ Invalid compose config"; exit 1; }

# 2. Cluster Refresh
echo "[CD] Shutting down active production containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

echo "[CD] Rebuilding and mounting multi-container configuration..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for database and backend services to become healthy
echo "[CD] Waiting for NestJS backend container to report healthy..."
for i in {1..30}; do
  if [ "$(docker compose -f docker-compose.prod.yml ps -q backend | xargs -I {} docker inspect --format='{{json .State.Health.Status}}' {})" == "\"healthy\"" ]; then
    echo "🟢 NestJS backend is healthy!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "❌ Timeout waiting for NestJS backend to become healthy."
    exit 1
  fi
  sleep 2
done

# 3. Relational Sync (Prisma Migrations Deployment)
echo "[CD] Synchronizing database schema with Prisma migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# 4. Integrated Post-Deployment Flight Probe
echo "[CD] Launching Ingress Health Prober within the cloud cluster..."
if docker compose -f docker-compose.prod.yml exec -T backend node dist/scripts/infrastructure-health-probe.js --single-run; then
  echo "🟢 [FLIGHT_PROBE] Ingress Health check PASSED successfully!"
  echo "================================================================================"
  echo "🎉 CD DEPLOYMENT SWEEP SUCCESSFUL (EXIT 0)"
  echo "================================================================================"
  exit 0
else
  echo "❌ [FLIGHT_PROBE] Ingress Health check FAILED or SLO bounds violated!"
  echo "================================================================================"
  echo "🚨 CD DEPLOYMENT BLOCKED - FLIGHT PROBE CRITICAL DEGRADATION (EXIT 1)"
  echo "================================================================================"
  exit 1
fi
