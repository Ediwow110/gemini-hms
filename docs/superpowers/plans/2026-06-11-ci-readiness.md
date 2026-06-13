# CI / Test Automation Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an automated, repeatable CI gatekeeper that strictly verifies static analysis, tests (unit/integration/e2e), and container builds from a clean state to protect the local baseline from regressions.

**Architecture:** A vendor-agnostic CI pipeline model (easily mapped to GitHub Actions or GitLab CI) relying on ephemeral Docker containers (PostgreSQL 15+) for backend tests and headless execution for frontend E2E tests.

**Tech Stack:** Node.js 20.x, PostgreSQL 15.x, Jest/Vitest, Playwright, Docker, Prisma.

---

## 1. Current Test/Build Baseline
- **Frontend:** Vitest for unit/components, Playwright for E2E. Tailwind v4 styling. Commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`.
- **Backend:** NestJS, Prisma, Jest. Commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:e2e`.
- **Database Setup:** `test/setup-db.ts` uses `npx prisma db push --accept-data-loss` and injects raw triggers.
- **Docker:** `hms-frontend/Dockerfile` and `hms-backend/Dockerfile` exist.

---

### Task 1: Consolidate Local Test Orchestration (The "Local Validate" Script)

Before wiring a cloud CI runner, we must prove the pipeline runs flawlessly locally via a single entry point.

**Files:**
- Create: `scripts/ci-local-validate.sh`
- Modify: `package.json` (Root, if applicable, to add a run script)

- [ ] **Step 1: Write the validation shell script**

```bash
#!/bin/bash
# scripts/ci-local-validate.sh
# Fails immediately if any command fails
set -e

echo "=== HMS Local CI Validation ==="

echo "[1/4] Running Static Analysis (Lint & Typecheck)..."
cd hms-backend && npm run lint && npm run typecheck && cd ..
cd hms-frontend && npm run lint && npm run typecheck && cd ..

echo "[2/4] Running Unit Tests..."
cd hms-backend && npm run test && cd ..
cd hms-frontend && npm run test -- --run && cd ..

echo "[3/4] Preparing Ephemeral Test DB & E2E..."
# Spin up test DB via Docker Compose
docker-compose -f docker-compose.test.yml up -d db-test
echo "Waiting for DB to be ready..."
sleep 5 # Replace with robust pg_isready check in production CI

cd hms-backend 
# Set test environment explicitely
export DATABASE_URL="postgresql://testuser:testpass@localhost:5432/hms_test?schema=public"
npm run test:e2e
cd ..

echo "[4/4] Verifying Docker Builds..."
docker build -t hms-backend:ci-test ./hms-backend
docker build -t hms-frontend:ci-test ./hms-frontend

echo "=== SUCCESS: Local CI Validation Passed ==="
docker-compose -f docker-compose.test.yml down -v
```

- [ ] **Step 2: Add executable permissions**
Run: `chmod +x scripts/ci-local-validate.sh`

- [ ] **Step 3: Create `docker-compose.test.yml`**
Create the minimal test infrastructure required.

```yaml
version: '3.8'
services:
  db-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: hms_test
    ports:
      - "5432:5432"
    tmpfs:
      - /var/lib/postgresql/data
```

- [ ] **Step 4: Commit**
```bash
git add scripts/ci-local-validate.sh docker-compose.test.yml
git commit -m "chore(ci): create local ci validation orchestration"
```

---

### Task 2: Define the CI Pipeline Configuration (GitHub Actions Reference)

Even without GitHub/GCP access, define the exact YAML workflow so it is ready to be committed when the repo is wired to a remote.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the CI workflow file**

```yaml
name: HMS CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20.x'

jobs:
  static-analysis:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - name: Backend Verify
        run: cd hms-backend && npm ci && npm run lint && npm run typecheck
      - name: Frontend Verify
        run: cd hms-frontend && npm ci && npm run lint && npm run typecheck

  backend-tests:
    name: Backend Tests (Unit & E2E)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: hms_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://testuser:testpass@localhost:5432/hms_test?schema=public
      JWT_SECRET: ci-test-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - run: cd hms-backend && npm ci
      - run: cd hms-backend && npm run test
      - run: cd hms-backend && npm run test:e2e
      - name: Archive backend coverage
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: hms-backend/coverage/

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '${{ env.NODE_VERSION }}' }
      - run: cd hms-frontend && npm ci
      - run: cd hms-frontend && npm run test -- --run
      # Playwright E2E execution would be added here

  docker-build:
    name: Verify Docker Builds
    runs-on: ubuntu-latest
    needs: [static-analysis, backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Build Backend
        run: docker build -t hms-backend:ci ./hms-backend
      - name: Build Frontend
        run: docker build -t hms-frontend:ci ./hms-frontend
```

- [ ] **Step 2: Commit**
```bash
git add .github/workflows/ci.yml
git commit -m "ci: define primary continuous integration pipeline"
```

---

## 3. Likely Blockers & Failure Points
1. **Playwright Headless Failures:** Frontend E2E tests often fail in headless CI environments if timeouts are too aggressive. Ensure `test:ci` passes the `--headed=false` flag properly.
2. **Database Race Conditions:** The `setup-db.ts` file uses `db push`. In a parallel CI runner environment, if multiple E2E suites run at once, they will drop each other's data. Jest `--runInBand` is required (which is already configured).
3. **Missing Environment Variables:** `.env.test` relies on local developer config. CI needs explicit overrides (like `JWT_SECRET`).

## 4. Artifact/Evidence Outputs Required
- **Test Coverage XML/LCOV:** Generated by Jest/Vitest.
- **Playwright Traces:** If E2E tests fail, traces must be uploaded as CI artifacts.
- **Docker Image Scan (Future Phase):** Eventually, SBOM and vulnerability scans of the built Docker images.

## 5. Final Readiness Verdict
Once the `scripts/ci-local-validate.sh` script runs green locally, the project is **CI-Ready**. The moment external repository access (e.g., GitHub) is granted, pushing the `.github/workflows/ci.yml` file will immediately activate the pipeline without further code churn.
