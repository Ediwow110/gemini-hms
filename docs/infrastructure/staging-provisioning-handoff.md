# Staging Environment Provisioning Handoff

**Author:** Production-Readiness Audit
**Date:** 2026-06-15
**Status:** BLOCKED — staging not provisioned

---

## 1. Purpose

This document defines exactly what must be provisioned to unblock staging verification for the Gemini-HMS application. It is written for the Platform/DevOps engineer who will create the staging environment.

---

## 2. Current State

| Aspect | Status |
|--------|--------|
| Code on `main` | ✅ Merged and synced |
| Remote CI (5 checks) | ✅ All pass |
| Vercel Preview (frontend only) | ✅ Exists — NOT staging |
| Production SSH target | ✅ Exists — NOT staging |
| **True staging environment** | **❌ DOES NOT EXIST** |
| Staging host / VM | ❌ |
| Staging database | ❌ |
| Staging secrets in GitHub | ❌ |
| Staging deployment workflow | ❌ |

---

## 3. Required Infrastructure

### 3.1 Staging Host

A Linux VM or container host with:
- Docker Engine 24+ and Docker Compose v2
- Node.js 20.x (for build-time, not runtime — Docker images are self-contained)
- curl, wget, rsync (for deployment scripts)
- SSH access for GitHub Actions runner
- Domain or subdomain for frontend and backend

**Minimum specs:** 2 vCPU, 4 GB RAM, 20 GB SSD (identical to production would be ideal for fidelity)

### 3.2 Staging URLs

| Component | Example URL | Notes |
|-----------|-------------|-------|
| Frontend | `https://staging.gemini-hms.example.com` | Nginx reverse proxy to port 80 |
| Backend API | `https://staging-api.gemini-hms.example.com` | Or same domain with /api/v1 path |
| Health endpoint | `https://staging-api.gemini-hms.example.com/health` | Must respond 200 |

### 3.3 Staging Database

A PostgreSQL 15 instance:
- Separate from production database
- Can be a managed RDS instance or a container on the staging host
- Must have its own credentials (never share with production)
- Schema managed by Prisma migrations at deploy time
- Data: seeded test data only (no production PHI)

---

## 4. Required GitHub Configuration

### 4.1 New Environment: `Staging`

Create a GitHub environment named `Staging` with:
- **Required reviewers:** Optional — can be removed for automated deploys
- **Wait timer:** None (auto-deploy on push to main)
- **Deployment branches:** `main` (auto-deploy) or a dedicated `staging` branch

> **Note:** The existing `deploy.yml` `cd-deploy` job does not use `environment: Production` — production secrets are currently at the repository level. While this is out of scope for the staging pass, consider creating a `Production` environment and migrating production secrets to it for parity and defense-in-depth.

### 4.2 Required Secrets (Environment-Level)

Add these to the `Staging` environment:

| Secret | Purpose | Example Value |
|--------|---------|---------------|
| `STAGING_SSH_HOST` | Staging host IP/hostname | `203.0.113.10` |
| `STAGING_SSH_USER` | SSH user | `deploy` |
| `STAGING_SSH_PRIVATE_KEY` | SSH deploy key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_DATABASE_URL` | Full PostgreSQL connection string | `postgresql://staging_user:SafePass123@localhost:5432/hms_staging?schema=public` |
| `STAGING_JWT_SECRET` | JWT signing key (different from prod) | `(64-char hex or base64)` |
| `STAGING_JWT_REFRESH_SECRET` | JWT refresh key (different from prod) | `(64-char hex or base64)` |
| `STAGING_MASTER_MFA_KEY` | MFA encryption key (different from prod) | `(32-char key)` |
| `STAGING_DB_USER` | Database user | `staging_user` |
| `STAGING_DB_PASSWORD` | Database password | `(auto-generated)` |
| `STAGING_DB_NAME` | Database name | `hms_staging` |
| `STAGING_CORS_ORIGINS` | CORS origins for staging | `https://staging.gemini-hms.example.com` |

### 4.3 Secret Separation Rules

| Tier | Scope | Example Secrets | Notes |
|------|-------|----------------|-------|
| **CI** | Repository-level | `CI_DATABASE_URL`, `CI_JWT_SECRET` | Test-only values, used in CI pipeline |
| **Staging** | Environment `Staging` | `STAGING_DATABASE_URL`, `STAGING_JWT_SECRET` | Staging-only values, must differ from CI and prod |
| **Production** | Environment `Production` | `DATABASE_URL`, `JWT_SECRET`, `SSH_HOST` | Production values, highest sensitivity. Actual workflow naming may differ (e.g., `deploy.yml` uses `PROD_DATABASE_URL`, `PROD_JWT_SECRET`). |

**Rules:**
- Never reuse CI secrets for staging
- Never reuse staging secrets for production
- Never store production secrets in staging's environment
- Rotate staging secrets on a defined schedule (quarterly minimum)

---

## 5. Required Workflow Structure

### 5.1 Option A — Dedicated `deploy-staging.yml` (Recommended)

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy Staging

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  ci-verification:
    name: CI Verification
    # Same as deploy.yml ci-verification job
    uses: ./.github/workflows/ci.yml  # Reuse existing CI

  docker-build:
    name: Build Staging Images
    needs: ci-verification
    runs-on: ubuntu-latest
    steps:
      # Same Docker build steps as deploy.yml docker-compile job
      # but tags include staging label instead of latest

  cd-deploy-staging:
    name: Deploy to Staging
    needs: docker-build
    environment: Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: SSH Deploy
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SSH_HOST: ${{ secrets.SSH_HOST }}
          SSH_USER: ${{ secrets.SSH_USER }}
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.STAGING_JWT_SECRET }}
          # ... other staging-specific secrets
        run: |
          # rsync + ssh deploy steps matching deploy.yml pattern
          # Use a staging-specific docker-compose.staging.yml or
          # the same docker-compose.prod.yml with staging env vars
```

### 5.2 Option B — Staging Gate in Existing Workflow

If the team prefers a single deploy.yml, add a staging job between docker-compile and cd-deploy:

```yaml
jobs:
  ci-verification: ...
  docker-compile: ...
  cd-deploy-staging:      # NEW — deploy to staging
    environment: Staging
    ...
  cd-deploy-production:   # Renamed from cd-deploy
    environment: Production
    needs: cd-deploy-staging  # Blocked on staging success
```

**Risk:** This couples staging and production deploy in a single workflow, making it harder to deploy staging independently for testing.

---

## 6. Required Verification Steps (Post-Provisioning)

Once staging is deployed, execute these checks:

### 6.1 Infrastructure Health

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Host reachable | `ssh deploy@staging-host` | SSH session established |
| Docker running | `docker ps` | Containers listed |
| DB healthy | `docker compose exec db pg_isready` | Accepting connections |
| Backend healthy | `curl -f https://staging-api/health` | HTTP 200 |
| Frontend loads | `curl -f https://staging/` | HTTP 200 |

### 6.2 Application Smoke Tests

| Check | Action | Expected |
|-------|--------|----------|
| Landing page | Browser → staging URL | Login page renders |
| Login flow | Submit valid credentials | Redirect to dashboard |
| CSRF bootstrapping | Inspect login response | `csrfToken` in body |
| Protected route | Access dashboard | 200, user data loads |
| Branch selection | Select a branch | Redirect to branch dashboard |
| Billing page | Navigate to /billing | Payments list loads |
| Audit page | Navigate to audit | Audit log loads |
| Logout | Click logout | Redirect to login, cookies cleared |

### 6.3 Security Verification

| Check | Action | Expected |
|-------|--------|----------|
| CORS headers | Staging origin | `Access-Control-Allow-Origin` matches staging URL |
| CSRF protection | POST without X-CSRF-Token | 403 Forbidden |
| MFA step-up | Trigger sensitive action | MFA challenge prompt |
| Session isolation | Log in as different user | No data leak between sessions |

### 6.4 Backend Integration Verification

| Check | Action | Expected |
|-------|--------|----------|
| E2E tests against staging | `npm run test:e2e` targeting staging DB | All pass |
| Migration rehearsal | Run `verify-migration-upgrade.ts` against staging DB | 34/34 pass |
| Health probe | Run `infrastructure-health-probe.js` | All probes pass |

---

## 7. Risk Controls (Must Implement)

| Control | Description |
|---------|-------------|
| **No direct CI→Prod promotion** | Production deploy must remain manual (`workflow_dispatch` only) |
| **Environment protection** | Staging environment must not have access to production secrets |
| **Separate database** | Staging DB must be isolated from production data |
| **No PHI in staging** | Staging data must be synthetic or anonymized |
| **Logging / monitoring** | Staging must have its own log stream and alerting |
| **Quarterly secret rotation** | All staging secrets rotated on a defined cadence |
| **Branch isolation** | Consider deploying staging from a `staging` branch for extra safety |

---

## 8. Files That Need Updates

| File | Current State | Required Change |
|------|---------------|-----------------|
| `AGENTS.md` | Mentions missing staging | Update after staging provisioned |
| `.github/workflows/deploy.yml` | Production-only (`workflow_dispatch`) | Add staging job OR create `deploy-staging.yml` |
| `.github/workflows/deploy-gate.yml` | Manual pre-deploy validation gate | Consider gating staging deploys through this or a parallel gate |
| `.github/workflows/docker-build.yml` | Manual Docker build (GHCR push stubbed) | Consolidate or remove if staging workflow supersedes it |
| `.github/workflows/ci.yml` | Push/PR CI (4 jobs) | Reusable — staging workflow should reference these jobs |
| (new) `docker-compose.staging.yml` | Does not exist | Create from `docker-compose.prod.yml` template with staging-specific env vars |
| `hms-backend/scripts/remote-deploy.sh` | Production hardcoded | Either parameterize with `ENVIRONMENT` arg or copy to `remote-deploy-staging.sh` |

---

## 9. Quick-Start Checklist

```text
[ ] 1. Provision Linux VM (or container host)
[ ] 2. Install Docker Engine 24+ and Docker Compose v2
[ ] 3. Create staging DNS records (frontend + API)
[ ] 4. Set up staging PostgreSQL 15 database
[ ] 5. Create GitHub `Staging` environment
[ ] 6. Generate staging secrets (different from CI and prod)
[ ] 7. Add secrets to GitHub `Staging` environment
[ ] 8. Create `deploy-staging.yml` workflow OR modify `deploy.yml`
[ ] 9. Create `docker-compose.staging.yml` if needed
[ ] 10. Push to main → trigger staging deploy
[ ] 11. Run verification checklist (Section 6)
[ ] 12. Document staging URLs, access, and secrets location
[ ] 13. Update AGENTS.md and handoff docs
```
