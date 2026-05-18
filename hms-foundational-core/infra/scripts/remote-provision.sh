#!/bin/bash
set -e

echo "================================================================================"
echo "🚀 INITIATING ZERO-TOUCH REMOTE PROVISIONING SEQUENCE"
echo "================================================================================"

echo "[1/4] Pulling Latest Production Tracking Branch Images..."
docker-compose pull

echo "[2/4] Executing Prisma Relational Schema Migrations..."
# Prevent row-level contamination explicitly via secure schema migration checks
npx prisma migrate deploy

echo "[3/4] Triggering Detached Multi-Container Rebuild..."
docker-compose up -d --build

echo "[4/4] Executing Zero-Downtime Hot Reload Sequence..."
docker-compose restart nginx-gateway

echo "================================================================================"
echo "✅ ZERO-TOUCH PROVISIONING COMPLETE: TARGET STATE REACHED"
echo "================================================================================"
