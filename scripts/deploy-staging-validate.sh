#!/usr/bin/env bash
set -e

echo "Starting Deployment Validation Script..."

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is required."
  exit 1
fi

echo "Verifying existence of CI-built Docker images..."
if ! docker image inspect hms-backend:ci >/dev/null 2>&1; then
  echo "Error: Docker image hms-backend:ci not found."
  exit 1
fi

if ! docker image inspect hms-frontend:ci >/dev/null 2>&1; then
  echo "Error: Docker image hms-frontend:ci not found."
  exit 1
fi

echo "Images verified."

echo "Executing Prisma migrations..."
docker run --rm -e DATABASE_URL="$DATABASE_URL" hms-backend:ci npx prisma migrate deploy
echo "Migrations completed successfully."

echo "Executing role seeding..."
docker run --rm -e DATABASE_URL="$DATABASE_URL" hms-backend:ci npm run prisma db seed
echo "Role seeding completed successfully."

echo "Performing dry-run start of backend container..."
CONTAINER_ID=$(docker run -d --rm -e DATABASE_URL="$DATABASE_URL" hms-backend:ci)

echo "Waiting 5 seconds for container to start..."
sleep 5

STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_ID")

if [ "$STATUS" != "running" ]; then
  echo "Error: Backend container crashed during dry-run start. Status: $STATUS"
  docker logs "$CONTAINER_ID"
  docker stop "$CONTAINER_ID" >/dev/null 2>&1 || true
  exit 1
fi

echo "Backend container dry-run successful (Status: $STATUS)."

echo "Cleaning up dry-run container..."
docker stop "$CONTAINER_ID" >/dev/null 2>&1
echo "Cleanup completed."

echo "Deployment Validation Sequence completed successfully."
