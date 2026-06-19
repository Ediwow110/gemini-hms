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
| Staging deployment workflow | ⚠️ Exists (`.github/workflows/deploy-staging.yml`) — environment still NOT provisioned |

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
| `STAGING_EMAIL_PROVIDER` | Email provider (non-mock) | `ses` or `mailrelay` |
| `STAGING_SMS_PROVIDER` | SMS provider (non-mock) | `semaphore` |
| `STAGING_AWS_REGION` | AWS region (if `EMAIL_PROVIDER=ses`) | `ap-southeast-1` |
| `STAGING_SES_SENDER_EMAIL` | SES verified sender (if `EMAIL_PROVIDER=ses`) | `noreply@staging.example.com` |
| `STAGING_SEMAPHORE_API_KEY` | Semaphore API key (if `SMS_PROVIDER=semaphore`) | `(api key)` |
| `STAGING_MAILRELAY_API_KEY` | Mailrelay key (if `EMAIL_PROVIDER=mailrelay`) | `(api key)` |
| `STAGING_MAILRELAY_SMTP_PASS` | Mailrelay SMTP pass (alt to API key) | `(password)` |
| `STAGING_MAILRELAY_SENDER_EMAIL` | Mailrelay sender email | `noreply@staging.example.com` |
| `STAGING_MAILRELAY_SENDER_NAME` | Mailrelay sender display name | `HMS Staging` |

> **Notification launch boundary:** `NODE_ENV=production` (set in `docker-compose.staging.yml`) rejects `EMAIL_PROVIDER=mock` and `SMS_PROVIDER=mock` at backend startup (`notification-providers.ts:166-170`, `188-192`). Real provider classes (`SesProvider`, `SemaphoreProvider`, etc.) validate credentials at construction but their `sendEmail`/`sendSms` methods still throw `NotImplementedException` until external HTTP/SDK integration is wired (`notification-providers.ts:103-108`, `138-143`). Staging deploy requires non-mock provider **configuration** so the backend starts; actual email/SMS **delivery** remains blocked until provider send implementations are completed.

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

### 5.0 Repo Status (code-ready, environment NOT provisioned)

The following repo artifacts **already exist** on `remediation/production-readiness-lane-2` (commit `72bd168` and later). Operator work is provisioning the host, database, DNS, and GitHub `Staging` environment secrets — not authoring these files:

| Artifact | Path | Status |
|----------|------|--------|
| Staging deploy workflow | `.github/workflows/deploy-staging.yml` | ✅ Committed — `workflow_dispatch` only; uses `environment: Staging` and `STAGING_*` / `STAGING_SSH_*` secrets |
| Staging compose topology | `docker-compose.staging.yml` | ✅ Committed — isolated volume/network |
| Staging remote deploy script | `hms-backend/scripts/remote-deploy-staging.sh` | ✅ Committed — references `docker-compose.staging.yml` only |

**Still missing (external):** staging VM/host, PostgreSQL 15 instance, DNS, GitHub `Staging` environment, and all `STAGING_*` secrets.

### 5.1 Option A — Dedicated `deploy-staging.yml` (Recommended) — IMPLEMENTED

Reference implementation (already in repo at `.github/workflows/deploy-staging.yml`):

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
| `AGENTS.md` | Notes staging blocked | Update after staging environment is provisioned and verified |
| `.github/workflows/deploy.yml` | Production-only (`workflow_dispatch`) | No change required — staging uses separate `deploy-staging.yml` |
| `.github/workflows/deploy-staging.yml` | ✅ Exists — `workflow_dispatch`, `environment: Staging` | Operator: add `Staging` environment + `STAGING_*` secrets, then run workflow |
| `.github/workflows/deploy-gate.yml` | Manual pre-deploy validation gate | Optional: gate staging deploys through this or a parallel gate |
| `.github/workflows/docker-build.yml` | Manual Docker build (GHCR push stubbed) | Optional consolidation — not blocking staging |
| `.github/workflows/ci.yml` | Push/PR CI (4 jobs) + `typecheck:tests` | Deploy staging only from green CI commits (manual discipline) |
| `docker-compose.staging.yml` | ✅ Exists | Operator: use as-is on staging host |
| `hms-backend/scripts/remote-deploy-staging.sh` | ✅ Exists | Operator: invoked by `deploy-staging.yml` rsync step |
| `hms-backend/scripts/remote-deploy.sh` | Production hardcoded | Unchanged — production isolation preserved |

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
[x] 8. `deploy-staging.yml` workflow — **done in repo** (operator still must create GitHub `Staging` environment + secrets)
[x] 9. `docker-compose.staging.yml` + `remote-deploy-staging.sh` — **done in repo**
[ ] 10. Operator: `workflow_dispatch` on `deploy-staging.yml` after secrets exist (not auto on push)
[ ] 11. Run verification checklist (Section 6)
[ ] 12. Document staging URLs, access, and secrets location
[ ] 13. Update AGENTS.md and handoff docs
```
