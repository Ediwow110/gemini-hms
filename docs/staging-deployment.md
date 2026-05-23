# Gemini-HMS Staging Infrastructure Operator Checklist

## Purpose
This checklist is for the human/operator who must provision the external infrastructure required to unblock live staging deployment.

## Current Project Status
- Application is release-candidate local green.
- Backend lint/build/unit tests pass.
- Backend E2E passes: 117/117.
- Prisma local migration status is synced: 41 migrations applied.
- Frontend lint/build passes.
- Clinical mutation allowlist remains exactly 12.
- Security verifier passes.
- No live staging deployment has occurred.

## Current Blocker
Live staging cannot proceed because the following infrastructure is missing:
1. Staging host or cluster
2. Dedicated staging PostgreSQL database
3. SSH/deployment credentials
4. TLS/HTTPS endpoint
5. GitHub Actions runner / CI execution path

**NON-NEGOTIABLE BOUNDARIES:**
- Do NOT use production infrastructure.
- Do NOT use production database.
- Do NOT use real patient data.
- Do NOT commit secrets to the repo.

---

## SECTION 1 — CHOOSE STAGING DEPLOYMENT TARGET
Pick exactly one staging target.

### Option A — Single Linux VM / EC2 / Compute Engine
*Recommended for first staging deployment.*
- **OS**: Ubuntu 22.04 LTS or equivalent.
- **Tools**: Docker & Docker Compose installed.
- **Access**: SSH access, non-root deploy user.
- **Network**: Inbound 80/443 allowed; backend/frontend ports internal only.
- **Size**: 2 vCPU, 4 GB RAM, 30+ GB disk.

### Option B — Kubernetes
*Use only if cluster operations are already comfortable.*
- **Namespace**: `staging`.
- **Ingress**: Controller + cert-manager or managed TLS.
- **Secrets**: Secret manager or sealed secrets.
- **Probes**: Readiness/liveness configured.

### Option C — Managed App Platform
*Allowed if it supports Docker images, env secrets, and Postgres.*

---

## SECTION 2 — PROVISION STAGING POSTGRESQL
Create a dedicated staging PostgreSQL instance.
- **Version**: PostgreSQL 15+.
- **DB Name**: `gemini_hms_staging`.
- **Access**: Network restricted to staging host/CI runner only.
- **Backups**: Snapshots enabled.
- **Secret**: `DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>?schema=public`.

---

## SECTION 3 — GENERATE STAGING SECRETS
Generate staging-only secrets (Minimum 32 characters for keys).
- `JWT_SECRET`
- `MASTER_MFA_KEY`
- `AUDIT_HMAC_SECRET`
- `CORS_ALLOWED_ORIGINS` (Must match staging frontend URL).

---

## SECTION 4 — CONFIGURE DEPLOYMENT ACCESS
- **SSH**: Configure `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` in CI secrets.
- **K8s**: Configure `kubeconfig` and staging context.
- **Security**: Use a dedicated staging-only deploy key.

---

## SECTION 5 — CONFIGURE TLS / DOMAIN
- **Domain**: e.g., `https://staging.gemini-hms.example`.
- **HTTPS**: Backend and Frontend must serve over TLS.
- **Proxy**: Nginx/Caddy/Traefik recommended for VM targets.

---

## SECTION 6 — CONFIGURE CI / GITHUB ACTIONS
- **Runner**: Ensure runner is available and connected.
- **Secrets**: Inject all Section 2, 3, and 4 secrets into the CI environment.
- **Workflow**: Ensure `ci.yml` runs full backend/frontend validation before deploy.

---

## SECTION 7 — FIRST STAGING MIGRATION
Run only after confirming `DATABASE_URL` points to staging.
```bash
npx prisma migrate status
npx prisma migrate deploy
```
*Do not run seed in staging unless explicitly approved.*

---

## SECTION 8 — FIRST STAGING DEPLOYMENT
- Build and push immutable image tags.
- Verify container health via `docker ps` or `kubectl get pods`.
- Verify readiness/liveness status.

---

## SECTION 9 — STAGING SMOKE TESTS
1. Public `/health` returns `200 UP`.
2. Frontend loads over HTTPS.
3. Protected APIs return `401` when unauthenticated.
4. `infrastructure-health-probe.ts` passes (latency < 800ms).

---

## SECTION 10 — ROLLBACK PLAN
- Record previous stable image tag.
- Take DB snapshot before any migration.
- Document manual revert steps for service images.

---

## SECTION 11 — FINAL EVIDENCE REQUIRED
To mark staging deployed, provide:
- Migration deploy log output.
- Deployment command output.
- Public health check URL/output.
- Clinical mutation verifier output (Exactly 12).
