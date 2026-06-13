# Staging Activation — External Blocked Status

## 1. Execution State

STATUS: **BLOCKED EXTERNALLY** — engineering-side pre-retry work is complete. The next staging activation cannot proceed until the Platform/DevOps team provisions the staging environment and populates required secrets.

## 2. What Is Proven

- **CI pipeline** (`ci.yml`): GREEN on `fa209b1` — static analysis, backend tests (1537), frontend tests, Docker build all pass
- **Deployment gate** (`deploy-gate.yml`): GREEN on `fa209b1` — schema migrations, E2E suite, Docker build validation all pass
- **Docker images**: Both backend (`node:20-alpine`) and frontend (`nginx:alpine`) multi-stage images build successfully
- **Application staging readiness**: Code is CI-verified, gate-verified, and Docker-verified

## 3. What Is Resolved Locally

- **Deploy-script health-probe path bug** (`hms-backend/scripts/remote-deploy.sh:47`): Fixed in `b088259`. The broken reference to `prisma/infrastructure-health-probe.ts` (which never existed in the production container) was replaced with `node dist/scripts/infrastructure-health-probe.js` (the compiled artifact).
- **Documentation**: INFRASTRUCTURE_UNBLOCK_HANDOFF.md, STAGING_RETRY_REQUEST.md, and this status note are in `docs/handoff/`.

## 4. What Remains Blocked Externally

All items require Platform/DevOps delivery. None have been started:

1. GCP IAM roles (4) granted on `unified-xylocarp-j524r`
2. GCP APIs (3) enabled
3. Staging compute host provisioned and SSH-reachable
4. Managed PostgreSQL 15+ instance provisioned
5. 11 GitHub Actions secrets populated
6. Container registry push path enabled
7. Staging DNS + TLS configured
8. Staging boundary confirmed (not production)

## 5. Waiting Condition

Engineering is frozen on staging activation until Platform/DevOps confirms all 8 items in §4 are delivered.

## 6. Trigger for Resuming Execution

When the retry gate is satisfied, execute:

1. **Workflow:** `.github/workflows/deploy-hms.yml` via `workflow_dispatch` (manual trigger — safer than push-triggered `deploy.yml`)
2. **Commit:** `fa209b1` (CI-green baseline) with `b088259` (deploy-script fix) on top
3. **Smoke:** After deployment, verify frontend loads, login works, and `/api/v1/admin/health` returns 200

The runbooks at `docs/runbooks/deploy.md` and `docs/deployment-runbook.md` contain the operational steps once the environment is reachable.
