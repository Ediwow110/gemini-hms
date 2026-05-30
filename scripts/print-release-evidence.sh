#!/usr/bin/env sh
set -eu

echo '=== Release Evidence ==='
echo "Commit SHA:       ${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}"
echo "Branch/Ref:       ${GITHUB_REF:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')}"
echo "Node version:     $(node --version 2>/dev/null || echo 'not found')"
echo "npm version:      $(npm --version 2>/dev/null || echo 'not found')"

if [ -f hms-backend/package.json ]; then
  BACKEND_NAME=$(node -e "const p=require('./hms-backend/package.json'); console.log(p.name+'@'+p.version)" 2>/dev/null || echo 'unknown')
  echo "Backend package:  $BACKEND_NAME"
fi

if [ -f hms-frontend/package.json ]; then
  FRONTEND_NAME=$(node -e "const p=require('./hms-frontend/package.json'); console.log(p.name+'@'+p.version)" 2>/dev/null || echo 'unknown')
  echo "Frontend package: $FRONTEND_NAME"
fi

if command -v docker >/dev/null 2>&1 && [ -f docker-compose.prod.yml ]; then
  if docker compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
    echo "Compose config:   valid"
  else
    echo "Compose config:   invalid"
  fi
else
  echo "Compose config:   skipped (docker or compose file not available)"
fi

echo '=== End Release Evidence ==='
