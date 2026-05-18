#!/usr/bin/env bash
# ==============================================================================
# SRE REMOTE DEPLOYMENT & PRODUCTION CLUSTER REFRESH
# ==============================================================================
set -euo pipefail

echo "================================================================================"
echo "🚀 INITIATING CLOUD REFRESH & DEPLOYMENT"
echo "================================================================================"

# Validate target environment variables
if [ -z "${DATABASE_URL:-}" ] || [ -z "${JWT_SECRET:-}" ] || [ -z "${MASTER_MFA_KEY:-}" ]; then
  echo "❌ CRITICAL: Missing mandatory deployment environment variables!"
  exit 1
fi

# 1. Secure Secret Ingestion
echo "[CD] Securely writing production secrets..."
cat <<EOF > hms-backend/.env.production
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
MASTER_MFA_KEY=${MASTER_MFA_KEY}
EOF
echo "[CD] Production .env.production generated securely."

# 2. Cluster Refresh
echo "[CD] Shouting down active production containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

echo "[CD] Rebuilding and mounting multi-container configuration..."
docker compose -f docker-compose.prod.yml up -d --build

# Wait for database and backend services to become healthy
echo "[CD] Waiting for NestJS backend container to report healthy..."
for i in {1..30}; do
  if [ "$(docker inspect --format='{{json .State.Health.Status}}' hms-login-design-backend-1)" == "\"healthy\"" ]; then
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
docker exec hms-login-design-backend-1 npx prisma migrate deploy

# 4. Integrated Post-Deployment Flight Probe
echo "[CD] Launching Ingress Health Prober within the cloud cluster..."
if docker exec hms-login-design-backend-1 npx tsx prisma/infrastructure-health-probe.ts --single-run; then
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
