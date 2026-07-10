#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.staging.yml"
REQUIRED_VARS=(
  BACKEND_IMAGE FRONTEND_IMAGE DATABASE_URL JWT_SECRET MASTER_MFA_KEY
  AUDIT_CHAIN_SECRET REDIS_URL DB_USER DB_PASSWORD DB_NAME
  CORS_ALLOWED_ORIGINS EMAIL_PROVIDER SMS_PROVIDER
)

require_variable() {
  local variable="$1"
  if [ -z "${!variable:-}" ]; then
    echo "ERROR: ${variable} is required for staging deployment."
    exit 1
  fi
}

for variable in "${REQUIRED_VARS[@]}"; do
  require_variable "${variable}"
done

case "${EMAIL_PROVIDER}" in
  ses)
    for variable in AWS_REGION SES_SENDER_EMAIL AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; do
      require_variable "${variable}"
    done
    ;;
  mailrelay)
    for variable in MAILRELAY_SMTP_HOST MAILRELAY_SMTP_USER MAILRELAY_SMTP_PASS MAILRELAY_SENDER_EMAIL MAILRELAY_SENDER_NAME; do
      require_variable "${variable}"
    done
    ;;
  *)
    echo "ERROR: EMAIL_PROVIDER must be ses or mailrelay in staging."
    exit 1
    ;;
esac

if [ "${SMS_PROVIDER}" != "semaphore" ]; then
  echo "ERROR: SMS_PROVIDER must be semaphore in staging."
  exit 1
fi
require_variable SEMAPHORE_API_KEY

docker compose -f "${COMPOSE_FILE}" config -q

previous_backend_image=""
previous_frontend_image=""
backend_container="$(docker compose -f "${COMPOSE_FILE}" ps -q backend 2>/dev/null || true)"
frontend_container="$(docker compose -f "${COMPOSE_FILE}" ps -q frontend 2>/dev/null || true)"

if [ -n "${backend_container}" ]; then
  previous_backend_image="$(docker inspect --format='{{.Config.Image}}' "${backend_container}" 2>/dev/null || true)"
fi
if [ -n "${frontend_container}" ]; then
  previous_frontend_image="$(docker inspect --format='{{.Config.Image}}' "${frontend_container}" 2>/dev/null || true)"
fi

wait_for_health() {
  local service="$1"
  local attempts="${2:-60}"
  local container_id

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    container_id="$(docker compose -f "${COMPOSE_FILE}" ps -q "${service}")"
    if [ -n "${container_id}" ]; then
      status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
      if [ "${status}" = "healthy" ] || [ "${status}" = "running" ]; then
        return 0
      fi
      if [ "${status}" = "unhealthy" ] || [ "${status}" = "exited" ] || [ "${status}" = "dead" ]; then
        docker compose -f "${COMPOSE_FILE}" logs --tail=200 "${service}" || true
        return 1
      fi
    fi
    sleep 2
  done

  docker compose -f "${COMPOSE_FILE}" logs --tail=200 "${service}" || true
  return 1
}

rollback_application() {
  if [ -z "${previous_backend_image}" ] || [ -z "${previous_frontend_image}" ]; then
    echo "No complete previous application image set is available for automatic rollback."
    return 1
  fi

  echo "Rolling back staging application containers to the previous images."
  BACKEND_IMAGE="${previous_backend_image}" \
  FRONTEND_IMAGE="${previous_frontend_image}" \
    docker compose -f "${COMPOSE_FILE}" up -d --no-deps backend frontend
  wait_for_health backend 60
  wait_for_health frontend 30
}

echo "Verifying immutable staging images are already loaded."
docker image inspect "${BACKEND_IMAGE}" >/dev/null
docker image inspect "${FRONTEND_IMAGE}" >/dev/null

docker compose -f "${COMPOSE_FILE}" up -d db
wait_for_health db 60

docker compose -f "${COMPOSE_FILE}" run --rm --no-deps backend npx prisma migrate deploy

docker compose -f "${COMPOSE_FILE}" up -d --no-deps backend
if ! wait_for_health backend 60; then
  rollback_application || true
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" up -d --no-deps frontend
if ! wait_for_health frontend 30; then
  rollback_application || true
  exit 1
fi

if ! docker compose -f "${COMPOSE_FILE}" exec -T backend \
  node dist/scripts/infrastructure-health-probe.js --single-run; then
  rollback_application || true
  exit 1
fi

echo "Staging deployment completed successfully."
