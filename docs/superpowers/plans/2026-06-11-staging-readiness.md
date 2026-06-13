# Phase 4: Staging / Deployment Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the blueprint and executable scripts required to provision, migrate, and smoke-test a vendor-agnostic cloud staging environment for the HMS application.

**Architecture:** A containerized deployment strategy relying on Docker multi-stage builds, orchestrated via standard compose or manifest patterns, targeting a managed PostgreSQL backend with strict IAM and network isolation.

**Tech Stack:** Docker, Prisma, Node.js, Shell Scripting, Playwright (for smoke testing).

---

## 1. Current Staging-Readiness Baseline
- **Codebase:** Stable local non-GCP freeze point. Core clinical and operational workflows are hardened.
- **CI Readiness:** Local CI validation (`scripts/ci-local-validate.sh`) is complete. GitHub Actions pipeline (`.github/workflows/ci.yml`) is drafted and locally verified.
- **Unproven:** Real-world database migrations, secret injection, and end-to-end connectivity outside of local development.

## 2. What is Already Prepared Locally
- `docker-compose.test.yml`: Ephemeral PostgreSQL testing orchestration.
- `.github/workflows/ci.yml`: The blueprint for CI execution and artifact generation.
- `hms-backend/Dockerfile` & `hms-frontend/Dockerfile`: Multi-stage build definitions.
- Hardened application code capable of running within these containers.

---

### Task 1: Define Environment Prerequisites & IAM Blockers Documentation

Before any infrastructure is touched, the explicit requirements must be documented to guide the DevOps/Platform team.

**Files:**
- Create: `docs/deployment/STAGING_PREREQUISITES.md`

- [ ] **Step 1: Write the prerequisites document**

```markdown
# Staging Environment Prerequisites & Blockers

## Environment Prerequisites
1. **Compute Environment**: A container orchestration platform (e.g., Kubernetes, GCP Cloud Run, or a dedicated Docker host) capable of pulling images from the container registry.
2. **Database**: A managed PostgreSQL 15+ instance.
    - Must be network-isolated (accessible only from the compute environment and CI runners).
    - Daily automated snapshots enabled.
3. **Network**: 
    - Public ingress restricted to ports 80 (redirect to 443) and 443 (HTTPS).
    - Valid TLS/SSL certificates provisioned for the staging domain.
4. **Secret Management**: A secure vault (e.g., GCP Secret Manager, HashiCorp Vault, or GitHub Environments) for injecting sensitive variables at runtime.

## Infrastructure / IAM Blockers (Must be resolved before deployment)
1. **Deployment Principal**: CI/CD pipelines require a dedicated Service Account/Principal with minimum-necessary permissions to push images and trigger deployments.
2. **Database Access**: Staging compute instances require IAM or network peering access to the staging PostgreSQL instance.
3. **Cross-Environment Isolation**: Cryptographic and network guarantees must exist ensuring staging credentials cannot reach production databases.
```

- [ ] **Step 2: Commit changes**
```bash
git add docs/deployment/STAGING_PREREQUISITES.md
git commit -m "docs(deployment): define staging environment prerequisites and IAM blockers"
```

---

### Task 2: Create Staging Migration & Deployment Validation Script

This script acts as the "dry run" for deployment, verifying that the built containers can start and run the Prisma migrations against a target database.

**Files:**
- Create: `scripts/deploy-staging-validate.sh`

- [ ] **Step 1: Write the staging validation script**

```bash
#!/bin/bash
# scripts/deploy-staging-validate.sh
# Validates the deployment sequence (migrations, seeding, container start) against a target environment.
# Requires: DATABASE_URL, JWT_SECRET, PORT to be set in the environment.

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL must be set for staging validation."
  exit 1
fi

echo "=== Staging Deployment Validation ==="

echo "[1/4] Verifying Docker Images..."
# Assumes images were built by CI
docker inspect hms-backend:ci > /dev/null || (echo "Missing hms-backend:ci" && exit 1)
docker inspect hms-frontend:ci > /dev/null || (echo "Missing hms-frontend:ci" && exit 1)

echo "[2/4] Executing Database Migrations..."
# Run Prisma migrate deploy using the backend container
docker run --rm -e DATABASE_URL="$DATABASE_URL" hms-backend:ci npx prisma migrate deploy

echo "[3/4] Executing Role Seeding..."
# Run the seed script using the backend container
docker run --rm -e DATABASE_URL="$DATABASE_URL" hms-backend:ci npm run prisma db seed

echo "[4/4] Starting Services (Dry Run)..."
# Start the backend temporarily to verify it doesn't crash on boot
CONTAINER_ID=$(docker run -d -e DATABASE_URL="$DATABASE_URL" -e JWT_SECRET="${JWT_SECRET:-dummy}" -p 3001:3000 hms-backend:ci npm run start:prod)

# Wait for boot
sleep 5

# Check if container is still running
if [ "$(docker inspect -f '{{.State.Status}}' $CONTAINER_ID)" != "running" ]; then
    echo "ERROR: Backend container crashed on startup."
    docker logs $CONTAINER_ID
    docker rm -f $CONTAINER_ID
    exit 1
fi

echo "Backend started successfully. Shutting down dry run."
docker rm -f $CONTAINER_ID

echo "=== SUCCESS: Staging Deployment Validation Passed ==="
```

- [ ] **Step 2: Make executable and commit**
```bash
chmod +x scripts/deploy-staging-validate.sh
git add scripts/deploy-staging-validate.sh
git commit -m "chore(deploy): add staging deployment validation script"
```

---

### Task 3: Define Staging Smoke-Test Scope

Create the explicit Playwright configuration and test file required to validate the live staging environment.

**Files:**
- Create: `hms-frontend/e2e/staging-smoke.spec.ts`
- Modify: `hms-frontend/package.json`

- [ ] **Step 1: Write the smoke test**

```typescript
// hms-frontend/e2e/staging-smoke.spec.ts
import { test, expect } from '@playwright/test';

// The STAGING_URL must be provided when running this suite
const baseURL = process.env.STAGING_URL || 'http://localhost:5173';

test.describe('Staging Environment Smoke Tests', () => {
  test('frontend is accessible and loads login page', async ({ page }) => {
    await page.goto(baseURL);
    await expect(page).toHaveTitle(/HMS/i);
    // Verify TLS/HTTPS if not localhost
    if (!baseURL.includes('localhost')) {
        expect(baseURL.startsWith('https://')).toBeTruthy();
    }
  });

  test('protected API routes reject unauthorized access', async ({ request }) => {
    // Assuming backend is accessible via /api on the frontend domain
    const response = await request.get(`${baseURL}/api/v1/patients`);
    expect(response.status()).toBe(401);
  });
});
```

- [ ] **Step 2: Add npm script**

Modify `hms-frontend/package.json` to include:
```json
    "test:staging-smoke": "playwright test e2e/staging-smoke.spec.ts"
```

- [ ] **Step 3: Commit**
```bash
git add hms-frontend/e2e/staging-smoke.spec.ts hms-frontend/package.json
git commit -m "test(e2e): define staging smoke test scope"
```

---

## 8. Required Evidence/Artifacts Before Calling Staging Valid
1. **Migration Logs**: Output of `npx prisma migrate deploy` demonstrating a clean schema transition.
2. **Container Health Logs**: Evidence that `hms-backend` and `hms-frontend` containers achieved `Running` status without restart loops.
3. **Smoke-Test Report**: Playwright output confirming the live URL is accessible over HTTPS and APIs correctly reject unauthorized access (401).

## 11. Entry and Exit Criteria
- **Entry Criteria**: Phase 3 CI Pipeline configuration is complete and locally validated. The local codebase remains functionally frozen.
- **Exit Criteria**: `STAGING_PREREQUISITES.md` is published, validation/smoke-test scripts are committed, and the team is technically prepared to wire the repository to cloud infrastructure.

## 12. Final Readiness Verdict
Once the scripts in this plan are committed and verified against local Docker environments, the project has achieved **Deployment Readiness**. The actual deployment to staging (executing the scripts against live cloud resources) is blocked until infrastructure provisioning and IAM access are resolved externally.
