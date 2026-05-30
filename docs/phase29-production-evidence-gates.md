# Phase 29 — Non-GCP Production-Level Evidence Gates

## Purpose

This phase moves Gemini HMS from a release-candidate codebase toward a defensible production-level system without depending on GCP for now.

The goal is not feature expansion. The goal is evidence: reproducible proof that the system can be built, started, smoke-tested, backed up, restored, monitored, reviewed, and rolled back.

## Current Position

- GCP production deployment is deferred.
- Real PHI onboarding is deferred.
- HIPAA certification is not claimed.
- SOC 2 certification is not claimed.
- Production readiness is not claimed until evidence gates pass.

## Required Evidence Artifacts

| Evidence Area | Required Artifact | Status |
|---|---|---|
| PR discipline | `.github/pull_request_template.md` | Added |
| Release discipline | `docs/release-checklist.md` | Added |
| Production-equivalent runtime | `docker-compose.prod.yml` | Hardened |
| Smoke testing | `scripts/smoke-prod.sh` | Added |
| Backup/restore proof | `docs/evidence/phase29-backup-restore.md` | Pending |
| Security proof | `docs/evidence/phase29-security.md` | Pending |
| Observability proof | `docs/evidence/phase29-observability.md` | Pending |
| Final go/no-go | `docs/evidence/phase29-final-readiness-report.md` | Pending |

## Production-Equivalent Runtime Contract

The local production-equivalent runtime must satisfy the following:

1. `NODE_ENV=production` is used for the backend.
2. PostgreSQL is not exposed to the host by default.
3. Backend is only exposed through the internal Docker network.
4. Frontend is the public entrypoint.
5. Backend health uses `/health`.
6. CORS origins are explicit and required.
7. Persistent database volume is used.
8. Startup order waits for database health before backend startup.
9. Frontend waits for backend health before becoming ready.

## Smoke Test Contract

`scripts/smoke-prod.sh` checks:

1. Frontend returns an HTML-like response.
2. Backend health endpoint returns an expected health marker.
3. Fetched frontend shell does not contain unsupported public claims such as `HIPAA Compliant`, `SOC2 Certified`, `SOC 2 Certified`, or `Production Ready`.

Example:

```bash
BASE_URL=http://localhost:8080 \
API_HEALTH_URL=http://localhost:8080/health \
sh scripts/smoke-prod.sh
```

If the frontend proxy does not route `/health`, set `API_HEALTH_URL` directly to a backend-accessible URL during the smoke test.

## Go/No-Go Rule

A final Phase 29 report must classify the project as exactly one of:

- `NO-GO`
- `STAGING-ONLY`
- `PILOT-READY`
- `PRODUCTION-READY`

Do not mark `PRODUCTION-READY` unless backup/restore, security, observability, release, and runtime evidence all pass.
