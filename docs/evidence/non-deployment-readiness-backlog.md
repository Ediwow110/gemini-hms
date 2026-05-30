# Non-Deployment Readiness Backlog

**Date:** 2026-05-30
**Context:** Deployment (GCP/staging/production) is paused. This backlog documents all known blockers and gaps to be addressed when deployment resumes, or fixed locally now.

## Classification Key

| Category | Label | Who Can Fix |
|---|---|---|
| Local | `[LOCAL]` | Any contributor, no special access |
| GitHub Admin | `[GH-ADMIN]` | Repository admin (branch protection, CI config) |
| Runtime/DB | `[RUNTIME]` | Requires PostgreSQL or local runtime environment |
| Staging/GCP | `[STAGE]` | Requires GCP access / staging deployment |
| Compliance | `[COMPLIANCE]` | Legal, compliance, or external review |
| Deferred Product | `[PRODUCT]` | Product feature work (Sprint 2B+, no deployment needed) |

---

## 1. GitHub Branch Protection Not Configured

| Field | Value |
|---|---|
| **Category** | `[GH-ADMIN]` |
| **Severity** | HIGH |
| **Owner** | Repository admin |
| **Current Status** | **Config file created** at `.github/branch-protection.json` (ND-2) specifying all 5 required checks (guard, build, frontend, backend, verifiers), required PR reviews (1), dismiss stale, linear history, no force pushes, no deletions, enforce admins. **Manually apply in GitHub settings — admin access required.** |
| **Why It Matters** | Without branch protection enforcement, unreviewed or untested code can land on `main`. Config file is ready but not yet enforced. |
| **Concrete Next Action** | Apply `.github/branch-protection.json` settings in GitHub repo → Settings → Branches → main → Add rule or Edit. Requires admin access. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | Yes — until enforced |
| **Blocks Production Readiness?** | Yes — until enforced |

---

## 2. Required CI Checks Not Configured

| Field | Value |
|---|---|
| **Category** | `[GH-ADMIN]` |
| **Severity** | HIGH |
| **Owner** | Repository admin |
| **Current Status** | **Config file updated** (`.github/branch-protection.json` via ND-2) with all 5 checks: `guard`, `build`, `frontend`, `backend`, `verifiers`. Must be applied in GitHub settings as required status checks. |
| **Why It Matters** | Required CI checks prevent broken or lint-ridden code from reaching `main`. Config is ready but not yet enforced. |
| **Concrete Next Action** | In GitHub repo settings, enable "Require status checks to pass before merging" and select all 5 checks. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | Yes — until enforced |
| **Blocks Production Readiness?** | Yes — until enforced |

---

## 3. CODEOWNERS File Missing

| Field | Value |
|---|---|
| **Category** | `[GH-ADMIN]` |
| **Severity** | MEDIUM |
| **Owner** | Repository admin |
| **Current Status** | **CREATED** at `.github/CODEOWNERS` (ND-2). Default owner `@Ediwow110` with per-path rules for backend, frontend, CI, deployment, scripts, and documentation. |
| **Why It Matters** | CODEOWNERS enables automatic review routing for critical paths. |
| **Concrete Next Action** | No further action — file exists. Ensure `.github/CODEOWNERS` is protected in branch protection rules if possible. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No — resolved |
| **Blocks Production Readiness?** | No — resolved |

---

## 4. PR Template Exists

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | LOW |
| **Owner** | — |
| **Current Status** | Already exists at `.github/pull_request_template.md`. This item is acknowledged as DONE. |
| **Why It Matters** | PR templates guide contributors toward consistent, complete descriptions. |
| **Concrete Next Action** | None. Existing template is present. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 5. GCP IAM Block

| Field | Value |
|---|---|
| **Category** | `[STAGE]` |
| **Severity** | BLOCKING |
| **Owner** | Account owner (`eediwow866@gmail.com`) |
| **Current Status** | Account lacks `serviceusage.serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`, `artifactregistry.admin` on project `unified-xylocarp-j524r`. |
| **Why It Matters** | Without these roles, no staging deployment, Cloud SQL provisioning, or Artifact Registry setup is possible. |
| **Concrete Next Action** | Request GCP project owner grant the missing IAM roles. |
| **Deployment Required?** | Yes (GCP) |
| **Blocks Pilot Readiness?** | Yes |
| **Blocks Production Readiness?** | Yes |

---

## 6. No Hosted Monitoring / Alert Routing

| Field | Value |
|---|---|
| **Category** | `[STAGE]` / `[GH-ADMIN]` |
| **Severity** | HIGH |
| **Owner** | Ops / Repository admin |
| **Current Status** | Health endpoints (`/api/v1/health`) exist. Alert rules are documented-only. No actual monitoring platform (GCP Monitoring, Datadog, Sentry) provisioned. |
| **Why It Matters** | Without hosted monitoring, outages go undetected. No alert routing means no one gets paged. |
| **Concrete Next Action** | Deploy staging, enable GCP Monitoring / Uptime Checks, configure alert notification channels (email, Slack, PagerDuty). |
| **Deployment Required?** | Yes |
| **Blocks Pilot Readiness?** | Yes |
| **Blocks Production Readiness?** | Yes |

---

## 7. No Real Staging Deployment

| Field | Value |
|---|---|
| **Category** | `[STAGE]` |
| **Severity** | BLOCKING |
| **Owner** | — |
| **Current Status** | All testing is local Docker Compose only. No staging environment with production-equivalent configuration, DNS, TLS, or load balancing exists. |
| **Why It Matters** | Local testing does not catch environment-specific issues: networking, secrets injection, TLS termination, CORS with real domains, DB connection pooling under load. |
| **Concrete Next Action** | Resolve GCP IAM block (item 5), then execute Phase 18-K staging deploy. |
| **Deployment Required?** | Yes |
| **Blocks Pilot Readiness?** | Yes |
| **Blocks Production Readiness?** | Yes |

---

## 8. No Restored App-Level Smoke Path (Phase 30C Deferred)

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` / `[RUNTIME]` |
| **Severity** | MEDIUM |
| **Owner** | — |
| **Current Status** | Phase 30B verified DB schema restoration (85 tables, 53 migrations) but did not run the application against the restored database. |
| **Why It Matters** | Schema fidelity does not guarantee application-level functionality. A restored DB might have missing rows, broken foreign keys, or stale sequences that only surface during login or data retrieval. |
| **Concrete Next Action** | If deployment remains paused, this can be done locally by pointing a secondary app stack (or a temporary backend container) at the restored DB and running `smoke-prod.sh`. |
| **Deployment Required?** | No (can be done locally) |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 9. Backend Lint Errors / Warnings

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | HIGH |
| **Owner** | Development team |
| **Current Status** | 228 lint errors reported in `hms-backend`. Pre-date Sprint 2A and Phase 29. |
| **Why It Matters** | Lint errors may indicate dead code, type confusion, or potential runtime bugs. They also make it hard to distinguish new issues from pre-existing noise. |
| **Concrete Next Action** | Audit the top 10-20 most severe lint errors. Fix patterns (unused vars, type mismatches) in small targeted PRs. Do not attempt a bulk fix. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 10. Audit Test Failures

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` / `[RUNTIME]` |
| **Severity** | MEDIUM |
| **Owner** | Development team |
| **Current Status** | 2 audit test failures. Pre-date Sprint 2A and Phase 29. |
| **Why It Matters** | Audit tests validate transactional integrity and idempotency. Failures may indicate gaps in the audit trail or idempotency logic. |
| **Concrete Next Action** | Run the failing tests (`npm test -- --grep audit` or similar), inspect the failure reason, and fix in a targeted PR. |
| **Deployment Required?** | No (tests run locally) |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 11. Frontend Typecheck / Lint Issues

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | — |
| **Owner** | — |
| **Current Status** | **VERIFIED — ALL RESOLVED.** TypeScript typecheck passes with 0 errors (`tsc --noEmit` exit 0). `CommandPalette.canAccess` typing is correct. `TopBar` component no longer exists in the codebase. `roleNavigation.ts` uses `React.ElementType` for icons. Frontend lint passes with 0 errors. Frontend tests: 14 suites, 114 tests, all PASS. Frontend build: PASS. |
| **Why It Matters** | N/A — all pre-existing type/lint issues have been resolved in earlier PRs. |
| **Concrete Next Action** | None. Verified and resolved. This item can be removed from active backlog. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No — already resolved |
| **Blocks Production Readiness?** | No — already resolved |

---

## 12. Migrations Unapplied (No PostgreSQL)

| Field | Value |
|---|---|
| **Category** | `[RUNTIME]` |
| **Severity** | — |
| **Owner** | — |
| **Current Status** | **VERIFIED — ALL 53 MIGRATIONS APPLIED.** Tested 2026-05-30 against local Docker PostgreSQL 15 (temporary container `postgres:15-alpine`, port 5433). Full round-trip: `prisma validate` (PASS), `prisma generate` (PASS), `migrate deploy` (53/53 applied), `migrate status` ("up to date!"), `db seed` (PASS). Backend tests: 68 suites/1246 tests all PASS. Backend build: PASS. |
| **Why It Matters** | N/A — all migrations verified against running PostgreSQL. |
| **Concrete Next Action** | None. Verified and resolved. Must be repeated whenever new migrations are added. |
| **Deployment Required?** | No (local Docker PostgreSQL) |
| **Blocks Pilot Readiness?** | No — verified against running DB |
| **Blocks Production Readiness?** | No — verified against running DB |

---

## 13. Pharmacist Role Not Seeded

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` / `[RUNTIME]` |
| **Severity** | — |
| **Owner** | — |
| **Current Status** | **VERIFIED — ALREADY SEEDED.** `Pharmacist` exists in `hms-backend/prisma/seed.ts` (line 227) with role UUID `00000000-0000-0000-0000-000000000008`, a permission mapping (line 296-298: `patient.view`, `inventory.item.view`, `inventory.stock.dispense`, `pharmacy.stockmovement.view`, `queue.view`), and a test user `pharmacist@hospital.com` (line 380). |
| **Why It Matters** | N/A — prerequisite already met. |
| **Concrete Next Action** | None. Verified and resolved. This item can be removed from active backlog. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No — already seeded |
| **Blocks Production Readiness?** | No — already seeded |

---

## 14. CRLF Script Diffs / Windows Shell Invocation Risk

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | LOW |
| **Owner** | Windows contributors |
| **Current Status** | **Resolved (ND-6)** — `.gitattributes` created enforcing `eol=lf` for shell scripts, TypeScript, JSON, Markdown, and CI files. See `docs/runbooks/local-windows-hygiene.md`. Three scripts (`db-backup.sh`, `db-restore.sh`, `smoke-prod.sh`) may still show CRLF diffs in existing working trees until `git checkout --` is run to re-normalize. |
| **Why It Matters** | CRLF can cause shebang failures on Linux. Persistent diffs create noise in `git status` and risk accidental commit of whitespace-only changes. |
| **Concrete Next Action** | Run `git add --renormalize .` to apply `.gitattributes` rules to all files, or `git checkout -- scripts/*.sh` to refresh individual scripts. New checkouts will automatically use LF. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 15. Backup Artifacts Should Not Be Committed

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | LOW |
| **Owner** | Contributors |
| **Current Status** | `.gitignore` now ignores `backups/`, `*.sql`, `*.dump` (added in this PR). No backup files are tracked. |
| **Why It Matters** | Backup files contain DB contents (synthetic data for drills, but still side-effect noise). They bloat the repository. |
| **Concrete Next Action** | Already mitigated by `.gitignore` update. Ensure `backups/` directory is listed in `.gitignore` on future branches. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 16. No Real-Device Mobile QA

| Field | Value |
|---|---|
| **Category** | `[LOCAL]` |
| **Severity** | LOW |
| **Owner** | QA / Development team |
| **Current Status** | Frontend has been tested on desktop browsers only. No real-device or emulator testing on iOS/Android. |
| **Why It Matters** | Responsive CSS, touch interactions, and mobile Safari/Chrome quirks are not caught in desktop testing. |
| **Concrete Next Action** | Test on at least one real mobile device or browser emulator before claiming mobile readiness. |
| **Deployment Required?** | No |
| **Blocks Pilot Readiness?** | No |
| **Blocks Production Readiness?** | No |

---

## 17. No External Security / Pentest Evidence

| Field | Value |
|---|---|
| **Category** | `[COMPLIANCE]` |
| **Severity** | HIGH |
| **Owner** | Security / Compliance |
| **Current Status** | No third-party penetration test or security audit has been performed. Evidence is limited to automated tooling (rate limiting, RBAC, CORS, no secrets committed). |
| **Why It Matters** | Automated checks do not replace manual penetration testing. Production deployment without pentest evidence carries legal/regulatory risk. |
| **Concrete Next Action** | Engage a third-party pentest firm after staging is deployed. Remediate findings before production. |
| **Deployment Required?** | Yes (pentest needs a deployed target) |
| **Blocks Pilot Readiness?** | No (pilot may proceed without pentest with risk acceptance) |
| **Blocks Production Readiness?** | Yes |

---

## 18. No HIPAA / SOC 2 Certification

| Field | Value |
|---|---|
| **Category** | `[COMPLIANCE]` |
| **Severity** | HIGH |
| **Owner** | Compliance / Legal |
| **Current Status** | Documentation consistently states "NOT HIPAA Compliant", "NOT SOC2 Certified", "NOT Production Ready". No certification process has been initiated. |
| **Why It Matters** | HIPAA/SOC2 certification requires months of operational evidence, policies, and audits. Claiming compliance without certification is a legal liability. |
| **Concrete Next Action** | Maintain the disclaimer framing. Do not claim compliance until formal certification process is complete. |
| **Deployment Required?** | Yes (certification needs a production environment) |
| **Blocks Pilot Readiness?** | No (pilot does not require certification) |
| **Blocks Production Readiness?** | Yes |

---

## Summary

### By Category

| Category | Count | Key Items |
|---|---|---|---|
| `[LOCAL]` | 5 | Lint errors, audit test failures, CRLF, mobile QA, backup ignore |
| `[GH-ADMIN]` | 2 | Branch protection, required CI (config files ready, admin apply needed) |
| `[RUNTIME]` | 1 | Phase 30C smoke path |
| `[STAGE]` | 4 | GCP IAM, staging deploy, monitoring, Phase 30C |
| `[COMPLIANCE]` | 2 | Pentest, certification |
| `[PRODUCT]` | 0 | All deferred product work is separate |

### By Blocker Status

| Blocks | Items |
|---|---|
| **Blocks Pilot Readiness** | Branch protection (config ready, apply needed), required CI (config ready, apply needed), GCP IAM, staging deploy, monitoring |
| **Blocks Production Readiness** | All of the above + pentest, certification |
| **Does Not Block** | Lint errors, audit failures, CRLF, backup artifacts, mobile QA, Phase 30C |

### Recommended Local-First Actions (when deployment is paused)

1. Fix the 2 audit test failures (item 10) — E2E only, blocked pending PostgreSQL
2. Optionally execute Phase 30C restored-app smoke path (item 8)
