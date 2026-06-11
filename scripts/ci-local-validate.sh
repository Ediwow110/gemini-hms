#!/usr/bin/env bash
set -e

echo "=== Running Local CI Validation ==="

echo "--- 1. Static Analysis ---"
echo "Backend..."
cd hms-backend
npm run lint
npm run typecheck
cd ..

echo "Frontend..."
cd hms-frontend
npm run lint
npm run typecheck
cd ..

echo "--- 2. Unit Tests ---"
echo "Backend Unit Tests..."
cd hms-backend
npm run test
cd ..

echo "Frontend Unit Tests..."
cd hms-frontend
npm run test -- --run
cd ..

echo "--- 3. Ephemeral Test DB & E2E Tests ---"
docker-compose -f docker-compose.test.yml up -d db-test
echo "Waiting for db-test to initialize..."
sleep 5

cd hms-backend
DATABASE_URL="postgresql://testuser:testpass@localhost:5432/hms_test?schema=public" npm run test:e2e
cd ..

echo "--- 4. Verify Docker Builds ---"
docker build -t hms-backend:ci-test ./hms-backend
docker build -t hms-frontend:ci-test ./hms-frontend

echo "--- 5. Clean up ---"
docker-compose -f docker-compose.test.yml down -v

echo "=== Success! Local CI Validation Passed ==="
