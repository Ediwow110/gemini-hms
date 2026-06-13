# Staging Retry Request — Platform / DevOps

## Current Status

| Item | Status |
|------|--------|
| Remote CI (`fa209b1`) | GREEN — all 4 jobs pass |
| Deployment gate (`fa209b1`) | GREEN — migrations + E2E + Docker build |
| Docker images | Build successfully in CI — **not pushed to any registry** |
| Deploy-script health-probe bug | **RESOLVED** — `b088259` fixes `remote-deploy.sh:47` |
| Infra / secrets provisioning | **BLOCKED** — not yet started |
| Second staging attempt | **NOT YET PERMISSIBLE** |

## What Is Already Resolved

- Application code is CI-verified and staging-ready
- Docker images compile correctly (multi-stage backend + frontend)
- `remote-deploy.sh:47` had a path bug (`prisma/infrastructure-health-probe.ts` does not exist in the production container; correct path is `dist/scripts/infrastructure-health-probe.js`). Fixed in commit `b088259`.

## What Remains Blocked

All infrastructure and secrets provisioning. None of the following have been delivered:

- Staging compute host (SSH-reachable, Docker runtime)
- Managed PostgreSQL 15+ instance (no public IP)
- 11 GitHub Actions secrets populated
- GCP IAM roles granted on `unified-xylocarp-j524r`
- Container registry push path enabled
- Staging DNS + TLS configured
- Staging boundary verified (not production ingress)

## Exact Deliverables Checklist

| # | Item | Detail |
|---|------|--------|
| 1 | Staging host | Reachable via SSH; `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` in GitHub secrets |
| 2 | PostgreSQL 15+ | `CI_DATABASE_URL` in GitHub secrets |
| 3 | GCP IAM | 4 roles on `unified-xylocarp-j524r` + 3 APIs enabled (commands in `docs/DEPLOYMENT_BLOCKER_GCP_IAM.md`) |
| 4 | Registry push | Uncomment push steps in `.github/workflows/docker-build.yml` or equivalent |
| 5 | GitHub secrets | 11 total — see `docs/handoff/INFRASTRUCTURE_UNBLOCK_HANDOFF.md §5` |
| 6 | Staging DNS/TLS | `*.staging.hms.example` or equivalent, TLS 1.2+ |
| 7 | Boundary confirmation | Written confirmation that target is staging, not production |

## Retry Gate

**Do not trigger a second staging activation until all 7 items above are confirmed delivered.**

The `deploy-hms.yml` workflow (`workflow_dispatch`) is the correct entry point for a manual retry. Do not use the push-triggered `deploy.yml` until the manual path succeeds first.

## Request

Provision the staging environment and populate the required secrets per the full handoff packet at `docs/handoff/INFRASTRUCTURE_UNBLOCK_HANDOFF.md`. Once the retry gate is satisfied, reply here and engineering will re-run the staging activation workflow.
