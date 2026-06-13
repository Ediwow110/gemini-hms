# Infrastructure Unblock Handoff — HMS Staging Activation

## 1. Executive Summary

| Item | Status |
|------|--------|
| Remote CI (commit `fa209b1`) | **GREEN** — all 4 jobs pass (static-analysis, backend-tests, frontend-tests, docker-build) |
| Deployment-gate (`fa209b1`) | **GREEN** — migrations + E2E + Docker build validation all pass |
| Docker image build | **GREEN** — both backend and frontend images compile successfully in CI |
| Staging deployment | **RED / BLOCKED** — never reached migrations, seeding, or smoke tests |
| Root cause | **No staging environment exists** — missing compute target, missing database, missing secrets, missing IAM grants |

**Prepared vs. proven:**
- Application code is **prepared** for staging (CI-verified, gate-verified, Docker-verified)
- Staging environment is **not proven** — it does not exist yet
- Deployment automation is **partially proven** (syntax-valid, but has at least one known path bug in the remote deploy script)

## 2. Current Technical State

### Remote CI (`ci.yml`)
- Fires on push/PR to `main`
- **4 jobs, all green** on `fa209b1`:
  - `static-analysis`: backend + frontend lint + typecheck
  - `backend-tests`: unit + E2E against ephemeral Postgres 15 container (1537 tests)
  - `frontend-tests`: vitest run
  - `docker-build`: multi-stage build for both backend (`node:20-alpine`) and frontend (`node:20-slim → nginx:alpine`)

### Deployment Gate (`deploy-gate.yml`)
- Fires on push to `main`
- Runs Prisma migrations + E2E full suite + Docker build validation
- **Passes** on `fa209b1`

### Main Deploy Workflow (`deploy.yml`) — targets remote host via SSH
- Fires on push to `main`
- 3 jobs: `ci-verification` → `docker-compile` → `cd-deploy`
- **cd-deploy** uses `appleboy/ssh-action` or raw SSH to rsync code + run `remote-deploy.sh`
- **NEVER REACHED** — no SSH_HOST, SSH_USER, or SSH_PRIVATE_KEY configured

### Manual Deploy Workflow (`deploy-hms.yml`) — `workflow_dispatch` only
- Targets `hms-foundational-core` subdirectory (note: this path may not match the actual repo structure)
- Same SSH-based provisioning via `appleboy/ssh-action`
- **NEVER REACHED** — same missing credentials

### Docker Images
- Both images build successfully in CI (confirmed green)
- Push to registry is **disabled** — `docker-build.yml` has push steps commented out
- Images exist only as CI build artifacts, not in any accessible registry

### Migrations / Seeding / Smoke Tests
- **Never attempted** — the deployment pipeline fails before reaching any `prisma migrate deploy`, seed, or health-probe step
- Deployment gate proves migrations are deployable against a clean Postgres 15 instance
- E2E tests prove the seeded service-level test data works

## 3. Exact Blockers

### B1 — No Staging Compute Target
No SSH-reachable host exists. The deployment workflows reference `secrets.SSH_HOST`, `secrets.SSH_USER`, and `secrets.SSH_PRIVATE_KEY`, none of which are set in GitHub Actions.

### B2 — No Staging Database
No managed PostgreSQL 15+ instance exists. `secrets.CI_DATABASE_URL` (and equivalent `secrets.DATABASE_URL`) are unset. Without a database, `prisma migrate deploy`, seeding, and all runtime operations fail.

### B3 — GCP IAM Roles Not Granted
The account `eediwow866@gmail.com` on project `unified-xylocarp-j524r` lacks four critical roles:
- `roles/serviceusage.serviceUsageAdmin`
- `roles/compute.admin`
- `roles/cloudsql.admin`
- `roles/artifactregistry.admin`

This blocks API enablement (`compute.googleapis.com`, `sqladmin.googleapis.com`, `artifactregistry.googleapis.com`) and resource provisioning.

### B4 — No Container Registry Push Path
Docker images are built in CI but not pushed to any registry. There is no `ghcr.io`, GCR, or Artifact Registry target configured. The `docker-build.yml` workflow has push steps commented out. Without registry-hosted images, the remote host cannot pull deployable artifacts.

### B5 — No Secret Injection Path
There is no vault or secrets manager configured. The deployment workflows inject secrets as plain `${{ secrets.* }}` expressions — which works once secrets exist in GitHub, but no staging-specific secrets have been provisioned.

### B6 — Missing Secrets Inventory (GitHub Actions)
The following secrets must exist in the GitHub repo before any SSH-based deployment can proceed:
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `CI_DATABASE_URL` (or `DATABASE_URL`)
- `CI_JWT_SECRET`
- `CI_JWT_REFRESH_SECRET`
- `MASTER_MFA_KEY`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `CORS_ALLOWED_ORIGINS`

**Current state: ZERO of the above are confirmed populated.**

### B7 — No Staging Environment Boundary Verification
Even if a host existed, there is no documented guarantee that the target is:
- Network-isolated from production
- Using a dedicated staging DNS name (e.g., `staging.hms.example`)
- Provisioned with non-production TLS certificates
- Running a staging-specific database (not a production snapshot)

## 4. Required Infrastructure Deliverables

Infrastructure team must provision the following before the next deployment attempt:

### Compute
- **1 VM or equivalent container runtime** — GCP e2-medium or equivalent (2 vCPU, 4GB RAM minimum; 4 vCPU, 8GB RAM recommended)
- **Docker runtime** verified working on the target
- **SSH access** for GitHub Actions runner (configured SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)

### Database
- **1 managed PostgreSQL 15+ instance** (e.g., GCP Cloud SQL) — 10GB minimum
- **No public IP** — accessible only from the staging compute VPC/network
- **Deployment user** with migration permissions (`npx prisma migrate deploy`)

### Secret Injection
- **GitHub Actions secrets** populated (per B6 checklist above)
- Or a managed secrets vault (GCP Secret Manager / HashiCorp Vault) with runtime injection path

### Container Registry
- **Registry target** configured — e.g., Artifact Registry repository or ghcr.io package
- **Push steps uncommented** in `docker-build.yml` (or equivalent workflow)
- **Pull credentials** available on the staging compute host

### Network / TLS
- **Load balancer or ingress** listening on ports 80/443
- **TLS 1.2+ certificate** for the staging domain
- **DNS records** for `*.staging.hms.example` or chosen staging domain

### Boundary Verification
- Confirmation that the staging target is **not** production ingress, not sharing production databases, and not accessible from production's network path

## 5. Required Secrets / Access Checklist

| # | Secret / Item | Required For | Status |
|---|--------------|-------------|--------|
| 1 | `SSH_HOST` | SSH-based rsync deploy | ☐ UNCONFIGURED |
| 2 | `SSH_USER` | SSH login identity | ☐ UNCONFIGURED |
| 3 | `SSH_PRIVATE_KEY` | SSH authentication | ☐ UNCONFIGURED |
| 4 | `CI_DATABASE_URL` | Backend database connection | ☐ UNCONFIGURED |
| 5 | `CI_JWT_SECRET` | JWT token signing (≥32 chars) | ☐ UNCONFIGURED |
| 6 | `CI_JWT_REFRESH_SECRET` | JWT refresh token signing | ☐ UNCONFIGURED |
| 7 | `MASTER_MFA_KEY` | MFA TOTP operations (≥32 chars) | ☐ UNCONFIGURED |
| 8 | `DB_USER` | Docker compose DB user var | ☐ UNCONFIGURED |
| 9 | `DB_PASSWORD` | Docker compose DB password var | ☐ UNCONFIGURED |
| 10 | `DB_NAME` | Docker compose DB name var | ☐ UNCONFIGURED |
| 11 | `CORS_ALLOWED_ORIGINS` | CORS whitelist for staging origin | ☐ UNCONFIGURED |
| 12 | Container registry push credentials | Push CI images to registry | ☐ UNCONFIGURED |
| 13 | GCP IAM role grants (4 roles) | Provision compute + database + registry | ☐ NOT GRANTED |
| 14 | GCP API enablement (3 APIs) | Enable Compute, SQL Admin, Artifact Registry | ☐ NOT ENABLED |

## 6. Evidence From Failed Attempt

### CI Run State (`fa209b1`)
- `ci.yml`: **GREEN** — all 4 jobs pass
- `deploy-gate.yml`: **GREEN** — migrations + E2E + Docker build validate
- `deploy.yml`: **⚠ FAILED BEFORE CD-DEPLOY** — `ci-verification` and `docker-compile` pass; `cd-deploy` cannot start because `secrets.SSH_HOST`, `secrets.SSH_USER`, `secrets.SSH_PRIVATE_KEY` are not configured
- `deploy-hms.yml`: **⚠ NEVER TRIGGERED** — `workflow_dispatch` only; would fail at the same SSH-action step

### What Log Evidence Exists
- CI logs for `ci.yml` and `deploy-gate.yml` — clean passes
- Deploy workflow logs for `deploy.yml` — show `ci-verification` and `docker-compile` OK, then `cd-deploy` fails at SSH key setup with an error equivalent to "SSH_HOST/SSH_USER/SSH_PRIVATE_KEY not found"
- No infrastructure-related logs exist beyond this point

### Failure Point Reached
The deployment pipeline hits a hard wall at **GitHub Actions variable resolution** — the runner cannot proceed past `${{ secrets.SSH_HOST }}` because the secret namespace is empty. No outbound SSH connection is attempted. No `rsync`, no `docker compose`, no `prisma migrate deploy`, no seeding, no smoke tests.

### Known Bug (non-blocking)
`hms-backend/scripts/remote-deploy.sh:47` references `prisma/infrastructure-health-probe.ts` but the file exists at `scripts/infrastructure-health-probe.ts`. This path mismatch will cause the post-deployment health probe to fail **after** the environment is provisioned. Fix this before the second activation attempt.

## 7. Go/No-Go Rule For Retry

**Do not attempt a second staging activation until ALL of the following are true:**

1. SSH-hosted staging compute target is provisioned and reachable
2. Managed PostgreSQL 15+ instance is provisioned, reachable from the compute target, and accepting connections
3. All 11 required GitHub Actions secrets (B6) are populated with valid, non-placeholder values
4. GCP IAM roles (section 3, B3) are granted and verified (`gcloud services list --enabled` confirms 3 APIs are enabled)
5. Docker images are pushed to a registry accessible from the staging host
6. `remote-deploy.sh` path bug (line 47) is corrected
7. Dedicated staging DNS name and TLS certificate are configured
8. A manual smoke test from an authenticated browser can reach the staging frontend

**Go condition is met only when all 8 items are confirmed by the infrastructure team.**

## 8. Immediate Next Action

**Grant the 4 missing GCP IAM roles** on project `unified-xylocarp-j524r` to principal `eediwow866@gmail.com`, then enable the 3 required APIs. This is the root dependency — nothing else can be provisioned until these permissions exist. Exact commands are in `docs/DEPLOYMENT_BLOCKER_GCP_IAM.md`.

---

*Prepared from repo state at commit `fa209b1`. CI evidence from remote runs. Staging environment: not yet proven.*
