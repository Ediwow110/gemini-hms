#!/usr/bin/env bash
set -euo pipefail

# apply-production-k8s.sh
# Usage:
#   PRODUCTION_JWT_SECRET=... PRODUCTION_JWT_REFRESH_SECRET=... PRODUCTION_DATABASE_URL=... ./apply-production-k8s.sh
# or export the variables in your shell and run the script.

EVIDENCE_DIR=${EVIDENCE_DIR:-docs/evidence/security/rotation/$(date +"%F-%H%M%S")}
mkdir -p "$EVIDENCE_DIR"

# Required env vars
if [ -z "${PRODUCTION_JWT_SECRET:-}" ]; then echo "ERROR: PRODUCTION_JWT_SECRET is not set" >&2; exit 2; fi
if [ -z "${PRODUCTION_JWT_REFRESH_SECRET:-}" ]; then echo "ERROR: PRODUCTION_JWT_REFRESH_SECRET is not set" >&2; exit 2; fi
if [ -z "${PRODUCTION_DATABASE_URL:-}" ]; then echo "ERROR: PRODUCTION_DATABASE_URL is not set" >&2; exit 2; fi

echo "Applying Kubernetes secret to 'production' namespace; evidence -> $EVIDENCE_DIR"

kubectl -n production create secret generic app-secrets \
  --from-literal=JWT_SECRET="$PRODUCTION_JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$PRODUCTION_JWT_REFRESH_SECRET" \
  --from-literal=DATABASE_URL="$PRODUCTION_DATABASE_URL" \
  --dry-run=client -o yaml | kubectl apply -f - > "$EVIDENCE_DIR/kubectl-apply.yaml" 2>&1 || { echo "kubectl apply failed" >&2; exit 3; }

kubectl -n production rollout restart deployment/hms-backend > "$EVIDENCE_DIR/kubectl-rollout-restart.txt" 2>&1 || { echo "rollout restart failed" >&2; exit 4; }

kubectl -n production rollout status deployment/hms-backend --timeout=300s > "$EVIDENCE_DIR/kubectl-rollout-status.txt" 2>&1 || { echo "rollout status failed or timed out" >&2; exit 5; }

kubectl -n production get pods -l app=hms-backend -o wide > "$EVIDENCE_DIR/pods.txt" 2>&1 || true

if [ -n "${HEALTH_URL:-}" ]; then
  echo "Running healthcheck against $HEALTH_URL"
  curl -fS "$HEALTH_URL" > "$EVIDENCE_DIR/healthcheck.txt" 2>&1 || { echo "healthcheck failed" >&2; exit 6; }
else
  echo "No HEALTH_URL set; skipping HTTP healthcheck"
fi

echo "Production Kubernetes secrets applied and backend restarted. Evidence saved to $EVIDENCE_DIR"
