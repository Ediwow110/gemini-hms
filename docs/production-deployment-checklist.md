# Production Deployment Checklist

Use this step-by-step checklist to guide final production deployments, database migrations, security audits, and Kubernetes deployments.

---

## Phase 1: Environment & Secret Provisioning
- [ ] Verify `DATABASE_URL` references a high-availability PostgreSQL cluster with connection pooling (e.g., PgBouncer).
- [ ] Verify `JWT_SECRET` is generated via a cryptographically secure random source (minimum 256 bits).
- [ ] Provision `MFA_HMAC_SECRET` in Secret Manager for MFA token generations.
- [ ] Register region env vars (`REGION`, `DATABASE_URL_US_EAST_1`, `DATABASE_URL_EU_WEST_1`, `DATABASE_URL_AP_SOUTHEAST_1`).

## Phase 2: Database Migration & Seeding
- [ ] Backup current production database:
  ```bash
  pg_dump -h localhost -U postgres -d hms_db -F c -b -v -f "/backups/pre-deploy-$(date +%F).dump"
  ```
- [ ] Run Prisma schema migration:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify database schema contains retention archival columns (`archived_at` on Patients, Encounters, etc.) and `cpt_codes` table.
- [ ] Seed standard CPT classifications:
  ```bash
  npx ts-node prisma/seed-cpt.ts
  ```

## Phase 3: Containerization & Docker Hardening
- [ ] Verify Docker container utilizes non-root `appuser` (uid 10001).
- [ ] Verify multi-stage build uses Alpine base to minimize attack surface.
- [ ] Verify healthcheck is active inside the Dockerfile:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node dist/healthcheck.js
  ```

## Phase 4: Kubernetes Cluster Rollout
- [ ] Verify resources requests and limits are defined for all containers (e.g., limits of 500m CPU and 512Mi Memory).
- [ ] Verify horizontal pod autoscaler (HPA) scale limits are from 2 to 10 replicas:
  ```yaml
  minReplicas: 2
  maxReplicas: 10
  ```
- [ ] Verify readiness and liveness endpoints reference `/api/v1/admin/health` (which integrates database and metrics status checks).
- [ ] Verify NGINX Ingress rules have TLS certificates and annotations enabling secure HTTPS routing.

## Phase 5: Live Verifications
- [ ] Trigger HIPAA compliance check: `/api/v1/compliance/hipaa/ephi-audit` (Confirm only tenant-scoped data returns).
- [ ] Verify Prometheus metric scrape: `/metrics` (Confirm latency and counters populate).
- [ ] Confirm region status pings: `/api/v1/replication/regions` (Confirm all replicas return `HEALTHY`).
