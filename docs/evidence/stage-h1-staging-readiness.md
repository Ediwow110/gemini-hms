# STAGE-H-1 — Staging Deployment / Environment Readiness

## Phase

STAGE-H-1 — Staging Deployment / Environment Readiness

## Branch

`stage/stage-h1-staging-readiness`

## Status

**BLOCKED** — GCP IAM permissions insufficient on target project `unified-xylocarp-j524r`.

## Environment Assessment

### GCP Projects

| Project ID | Name | IAM Status | Services Enabled |
|------------|------|------------|-----------------|
| `unified-xylocarp-j524r` | (unnamed) | **BLOCKED**: account `eediwow866@gmail.com` lacks `serviceusage.serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`, `artifactregistry.admin` | Unknown (cannot enable APIs) |
| `gemini-hms-staging` | gemini-hms-staging | **PARTIAL**: `cloudresourcemanager` API enabled successfully; Compute Engine API disabled | Minimal |

### IAM Block Details

On `unified-xylocarp-j524r`:
- `gcloud services enable cloudresourcemanager.googleapis.com` → `PERMISSION_DENIED`
- Cannot enable Compute Engine API, Cloud SQL API, or Artifact Registry API
- Cannot view or modify IAM policy

On `gemini-hms-staging`:
- `cloudresourcemanager` API enabled
- `gcloud services enable` works for at least some APIs
- Compute Engine API disabled (not yet enabled)
- Cloud SQL API disabled (not yet enabled)

### Staging Blueprint

If IAM were unblocked on either project, the following would be required:

| Step | Action | GCP Service | Status |
|------|--------|-------------|--------|
| 1 | Enable Compute Engine API | `compute.googleapis.com` | Requires IAM |
| 2 | Enable Cloud SQL API | `sqladmin.googleapis.com` | Requires IAM |
| 3 | Enable Artifact Registry API | `artifactregistry.googleapis.com` | Requires IAM |
| 4 | Provision VM instance | Compute Engine | Requires IAM |
| 5 | Provision PostgreSQL (Cloud SQL) | Cloud SQL admin | Requires IAM |
| 6 | Create Artifact Registry repo | Artifact Registry | Requires IAM |
| 7 | Build & push Docker image | Cloud Build / Artifact Registry | Requires IAM |
| 8 | Run migrations on Cloud SQL | Cloud SQL proxy + Prisma | Requires connectivity |
| 9 | Deploy container to VM | Compute Engine / SSH | Requires connectivity |

### Migration Status

The following Prisma migrations exist but have never been applied to any database:

| Migration | Phase | Date | Status |
|-----------|-------|------|--------|
| `20260523000000_add_triage_vitals_note_fields` | Phase 14A | 2026-05-23 | UNAPPLIED |
| `20260523120000_add_order_lab_fields` | Phase 14A | 2026-05-23 | UNAPPLIED |
| `20260523130000_add_prescription_dispense_fields` | Sprint 2A | 2026-05-23 | UNAPPLIED |

All three must be applied before staging can serve the full feature set.

### CI/GitHub Actions Status

GitHub Actions workflows exist and run on every PR push. Local-green evidence is used as proxy:

- **Tests**: 1537/1537 PASS
- **Build**: Production Docker build PASS
- **Lint**: 0 errors
- **Typecheck**: PASS

No deployed environment exists to run E2E tests against.

## Recommendations

1. **Request GCP IAM roles** on `unified-xylocarp-j524r`: `serviceusage.serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`, `artifactregistry.admin`
2. **OR use `gemini-hms-staging`** as the staging project (already has partial access) — enable Compute Engine, Cloud SQL APIs
3. **Apply migrations** (`npx prisma migrate deploy`) on staging database
4. **Run production Docker build** and push to registry
5. **Deploy and smoke-test** the staging deployment
6. **Run E2E tests** against staging

## Verification

```bash
# GCP access test
gcloud config set project unified-xylocarp-j524r
gcloud services enable cloudresourcemanager.googleapis.com
→ PERMISSION_DENIED (BLOCKER CONFIRMED)

# Local-green evidence
npm test → 1537/1537 PASS
npm run build → PASS
```

## Evidence

- `docs/evidence/stage-h1-staging-readiness.md`

## Final Verdict

BLOCKED / STAGE-H-1 STAGING READINESS DOCUMENTED
