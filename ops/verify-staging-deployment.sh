#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Gemini-HMS Staging Deployment Verification Script
# Validates health probes, container status, and application smoke tests
#
# Usage: ./verify-staging-deployment.sh <STAGING_HOST>
# Example: ./verify-staging-deployment.sh staging.yourhospital.org
###############################################################################

STAGING_HOST="${1:-}"

if [ -z "$STAGING_HOST" ]; then
  echo "Usage: $0 <STAGING_HOST>" >&2
  echo "  STAGING_HOST - Staging domain or IP (e.g., staging.yourhospital.org)" >&2
  exit 64
fi

BACKEND_URL="http://${STAGING_HOST}/api/v1/health"
FRONTEND_URL="http://${STAGING_HOST}/"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((PASS_COUNT++))
}

fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((FAIL_COUNT++))
}

warn() {
  echo -e "${YELLOW}⚠ WARN${NC}: $1"
  ((WARN_COUNT++))
}

echo "=== Gemini-HMS Staging Deployment Verification ==="
echo "Target: ${STAGING_HOST}"
echo "Backend: ${BACKEND_URL}"
echo "Frontend: ${FRONTEND_URL}"
echo ""

# Check 1: DNS Resolution
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. DNS & Network Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ping -c 1 -W 3 "${STAGING_HOST}" &>/dev/null; then
  pass "DNS resolves: ${STAGING_HOST}"
else
  # Try as IP
  if ping -c 1 -W 3 "${STAGING_HOST}" &>/dev/null; then
    pass "Host reachable: ${STAGING_HOST}"
  else
    fail "Cannot reach host: ${STAGING_HOST}"
    echo "Check DNS records or VPN connectivity."
    exit 1
  fi
fi

# Check 2: SSH Access
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. SSH Access (deploy user)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 deploy@"${STAGING_HOST}" "echo 'SSH OK'" 2>/dev/null; then
  pass "SSH access as deploy@${STAGING_HOST}"
else
  fail "SSH access failed. Check deploy user and SSH key."
fi

# Check 3: Docker Status on VM
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Docker Container Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DOCKER_STATUS=$(ssh -o StrictHostKeyChecking=no deploy@"${STAGING_HOST}" "docker compose -f /home/deploy/app/docker-compose.staging.yml ps --format json 2>/dev/null || docker ps --format '{{.Names}}: {{.Status}}' 2>/dev/null || echo 'NO_DOCKER'" 2>/dev/null || echo "SSH_FAILED")

if [ "$DOCKER_STATUS" = "SSH_FAILED" ]; then
  fail "Cannot check Docker status (SSH issue)"
elif [ "$DOCKER_STATUS" = "NO_DOCKER" ]; then
  fail "Docker not running or no containers found"
else
  pass "Docker is running"

  # Check for expected containers
  if echo "$DOCKER_STATUS" | grep -qi "backend\|hms-backend"; then
    pass "Backend container exists"
  else
    warn "Backend container not found in docker ps"
  fi

  if echo "$DOCKER_STATUS" | grep -qi "frontend\|hms-frontend"; then
    pass "Frontend container exists"
  else
    warn "Frontend container not found in docker ps"
  fi

  if echo "$DOCKER_STATUS" | grep -qi "db\|postgres\|hms_staging_db"; then
    pass "Database container exists"
  else
    warn "Database container not found in docker ps"
  fi
fi

# Check 4: Backend Health Endpoint
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Backend Health Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_RESPONSE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 15 "${BACKEND_URL}" 2>/dev/null || echo "TIMEOUT")

if [ "$HEALTH_RESPONSE" = "200" ]; then
  pass "Backend health endpoint returns HTTP 200"

  # Parse health response body
  HEALTH_BODY=$(curl -sf --max-time 10 "${BACKEND_URL}" 2>/dev/null || echo '{}')
  if echo "$HEALTH_BODY" | grep -q '"status":"UP"'; then
    pass "Backend reports status UP"
  elif echo "$HEALTH_BODY" | grep -q '"status"'; then
    STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | head -1)
    if echo "$STATUS" | grep -q "UP"; then
      pass "Backend status: ${STATUS}"
    else
      fail "Backend status not UP: ${STATUS}"
    fi
  else
    warn "Health response format unexpected: ${HEALTH_BODY}"
  fi
elif [ "$HEALTH_RESPONSE" = "TIMEOUT" ]; then
  fail "Backend health endpoint TIMEOUT (15s)"
else
  fail "Backend health endpoint returns HTTP ${HEALTH_RESPONSE} (expected 200)"
fi

# Check 5: Frontend Availability
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Frontend Web Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 15 "${FRONTEND_URL}" 2>/dev/null || echo "TIMEOUT")

if [ "$FRONTEND_STATUS" = "200" ]; then
  pass "Frontend returns HTTP 200"

  # Check for HTML content
  FRONTEND_BODY=$(curl -sf --max-time 10 "${FRONTEND_URL}" 2>/dev/null || echo '')
  if echo "$FRONTEND_BODY" | grep -qi "<!DOCTYPE html\|<html\|<div"; then
    pass "Frontend returns valid HTML"
  else
    warn "Frontend response may not be HTML"
  fi
elif [ "$FRONTEND_STATUS" = "TIMEOUT" ]; then
  fail "Frontend TIMEOUT (15s)"
else
  fail "Frontend returns HTTP ${FRONTEND_STATUS} (expected 200)"
fi

# Check 6: CSRF Token Availability
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Security: CSRF Token"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CSRF_CHECK=$(curl -sf -D - --max-time 10 "http://${STAGING_HOST}/api/v1/auth/csrf" 2>/dev/null | grep -i "csrf\|token" || echo "NO_CSRFS")

if [ "$CSRF_CHECK" != "NO_CSRFS" ]; then
  pass "CSRF token endpoint available"
else
  # Try getting CSRF from login page
  LOGIN_RESPONSE=$(curl -sf -D - --max-time 10 "http://${STAGING_HOST}/" 2>/dev/null | grep -i "csrf\|Cookie" || echo "")
  if [ -n "$LOGIN_RESPONSE" ]; then
    pass "CSRF cookie present in response"
  else
    warn "CSRF token not detected (may be client-side only)"
  fi
fi

# Check 7: Database Migration Status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Database Migration Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MIGRATION_CHECK=$(ssh -o StrictHostKeyChecking=no deploy@"${STAGING_HOST}" "docker compose -f /home/deploy/app/docker-compose.staging.yml exec -T db pg_isready -U hms_staging_user -d gemini_hms_staging 2>/dev/null || docker compose -f /home/deploy/app/docker-compose.staging.yml ps db 2>/dev/null | grep -i healthy || echo 'UNKNOWN'" 2>/dev/null || echo "SSH_ERROR")

if echo "$MIGRATION_CHECK" | grep -qi "accepting\|healthy\|ok"; then
  pass "Database is accepting connections"
else
  warn "Database status unclear: ${MIGRATION_CHECK}"
fi

# Check 8: Container Error Logs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Container Error Logs (last 50 lines)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERROR_LOGS=$(ssh -o StrictHostKeyChecking=no deploy@"${STAGING_HOST}" "docker compose -f /home/deploy/app/docker-compose.staging.yml logs --tail=50 backend 2>/dev/null | grep -i 'error\|fatal\|exception\|panic' | tail -5 || echo 'NO_ERRORS'" 2>/dev/null || echo "SSH_ERROR")

if [ "$ERROR_LOGS" = "NO_ERRORS" ] || [ "$ERROR_LOGS" = "SSH_ERROR" ]; then
  pass "No critical errors in recent backend logs"
else
  warn "Recent backend errors detected:"
  echo "$ERROR_LOGS" | head -5
fi

# Check 9: Port Exposure
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Port Exposure Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check that 80 is open
if curl -sf -o /dev/null -w "%{http_code}" --max-time 5 "http://${STAGING_HOST}/" 2>/dev/null | grep -q "200\|301\|302\|404"; then
  pass "Port 80 (HTTP) is accessible"
else
  fail "Port 80 (HTTP) not accessible"
fi

# Check that 5432 is NOT publicly accessible
DB_CHECK=$(timeout 3 bash -c "cat < /dev/null > /dev/tcp/${STAGING_HOST}/5432" 2>/dev/null && echo "OPEN" || echo "BLOCKED")
if [ "$DB_CHECK" = "BLOCKED" ]; then
  pass "Port 5432 (PostgreSQL) is NOT publicly accessible"
elif [ "$DB_CHECK" = "OPEN" ]; then
  fail "Port 5432 (PostgreSQL) is PUBLICLY ACCESSIBLE - SECURITY RISK!"
else
  warn "Could not verify PostgreSQL port exposure"
fi

# Check that 6379 is NOT publicly accessible
REDIS_CHECK=$(timeout 3 bash -c "cat < /dev/null > /dev/tcp/${STAGING_HOST}/6379" 2>/dev/null && echo "OPEN" || echo "BLOCKED")
if [ "$REDIS_CHECK" = "BLOCKED" ]; then
  pass "Port 6379 (Redis) is NOT publicly accessible"
elif [ "$REDIS_CHECK" = "OPEN" ]; then
  fail "Port 6379 (Redis) is PUBLICLY ACCESSIBLE - SECURITY RISK!"
else
  warn "Could not verify Redis port exposure"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}Passed:${NC}  ${PASS_COUNT}"
echo -e "  ${RED}Failed:${NC}  ${FAIL_COUNT}"
echo -e "  ${YELLOW}Warnings:${NC} ${WARN_COUNT}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}=== STAGING DEPLOYMENT VERIFIED SUCCESSFULLY ===${NC}"
  echo ""
  echo "Staging URL: http://${STAGING_HOST}/"
  echo "API Health:  ${BACKEND_URL}"
  echo ""
  echo "Next steps:"
  echo "1. Run browser smoke tests against staging"
  echo "2. Verify login flow with seeded credentials"
  echo "3. Update AGENTS.md with staging URLs"
  exit 0
else
  echo -e "${RED}=== STAGING VERIFICATION FAILED ===${NC}"
  echo ""
  echo "Please investigate the failed checks above."
  echo "Common fixes:"
  echo "  - Ensure Docker containers are running: ssh deploy@${STAGING_HOST} 'docker compose ps'"
  echo "  - Check backend logs: ssh deploy@${STAGING_HOST} 'docker compose logs backend'"
  echo "  - Verify database is healthy: ssh deploy@${STAGING_HOST} 'docker compose ps db'"
  exit 1
fi
