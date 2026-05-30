#!/usr/bin/env sh
set -eu

BASE_URL="${BASE_URL:-http://localhost:8080}"
API_HEALTH_URL="${API_HEALTH_URL:-$BASE_URL/health}"
FRONTEND_URL="${FRONTEND_URL:-$BASE_URL/}"

printf 'HMS production-equivalent smoke test\n'
printf 'Frontend URL: %s\n' "$FRONTEND_URL"
printf 'API health URL: %s\n' "$API_HEALTH_URL"

if command -v curl >/dev/null 2>&1; then
  HTTP_CLIENT="curl"
elif command -v wget >/dev/null 2>&1; then
  HTTP_CLIENT="wget"
else
  echo 'ERROR: curl or wget is required.' >&2
  exit 1
fi

fetch() {
  url="$1"
  if [ "$HTTP_CLIENT" = "curl" ]; then
    curl -fsS "$url"
  else
    wget -qO- "$url"
  fi
}

printf '\n[1/3] Checking frontend shell...\n'
FRONTEND_BODY="$(fetch "$FRONTEND_URL")"
printf '%s' "$FRONTEND_BODY" | grep -Eiq '<html|<div|script' || {
  echo 'ERROR: frontend did not return an HTML-like response.' >&2
  exit 1
}
echo 'OK: frontend responded.'

printf '\n[2/3] Checking backend health...\n'
HEALTH_BODY="$(fetch "$API_HEALTH_URL")"
printf '%s' "$HEALTH_BODY" | grep -Eiq 'UP|ok|healthy|status' || {
  echo 'ERROR: backend health response did not contain an expected health marker.' >&2
  printf 'Response: %s\n' "$HEALTH_BODY" >&2
  exit 1
}
echo 'OK: backend health responded.'

printf '\n[3/3] Checking no unsupported public claims in fetched frontend shell...\n'
if printf '%s' "$FRONTEND_BODY" | grep -Eiq 'HIPAA Compliant|SOC2 Certified|SOC 2 Certified|Production Ready'; then
  echo 'ERROR: unsupported public production/compliance claim found in frontend response.' >&2
  exit 1
fi
echo 'OK: no unsupported public claims found in frontend shell.'

printf '\nSmoke test passed.\n'
