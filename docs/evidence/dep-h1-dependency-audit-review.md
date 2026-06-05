# DEP-H-1 — Dependency Audit / Advisory Review

## Phase

DEP-H-1 — Dependency Audit / Advisory Review

## Branch

`deps/dep-h1-dependency-audit-review`

## Scope

- Dependency audit only
- Safe fix applied: `hono` 4.12.18 → 4.12.23 (patch update via `npm audit fix`)
- No feature changes, no schema/migrations, no deployment changes

## Audit Results

### Backend (`hms-backend/`)

| Advisory | Severity | Type | Direct/Transitive | Fix Available | Action |
|----------|----------|------|-------------------|---------------|--------|
| Hono IP restriction bypass (GHSA-xrhx-7g5j-rcj5) | moderate | Dev-only | Transitive (prisma → @prisma/dev → hono) | `npm audit fix` | **FIXED** (4.12.18 → 4.12.23) |
| Hono Set-Cookie injection (GHSA-3hrh-pfw6-9m5x) | moderate | Dev-only | Transitive | `npm audit fix` | **FIXED** (same update) |
| Hono JWT scheme bypass (GHSA-f577-qrjj-4474) | moderate | Dev-only | Transitive | `npm audit fix` | **FIXED** (same update) |
| Hono mount prefix bypass (GHSA-2gcr-mfcq-wcc3) | moderate | Dev-only | Transitive | `npm audit fix` | **FIXED** (same update) |
| @hono/node-server middleware bypass (GHSA-92pp-h63x-v22m) | moderate | Dev-only | Transitive (prisma → @prisma/dev → @hono/node-server) | Requires `--force` (breaking prisma version) | **DEFERRED** |

### Frontend (`hms-frontend/`)

| Advisory | Severity | Type | Action |
|----------|----------|------|--------|
| None | — | — | 0 vulnerabilities |

## Deferred Advisory

**@hono/node-server** <1.19.13 (3 duplicate findings due to 3 vulnerable paths):
- Moderate severity, dev-only
- Affects Prisma CLI's internal dev toolchain only
- Fix would require `npm audit fix --force` which downgrades prisma from 7.x → 6.x (breaking change)
- No runtime or production impact
- Prisma must update their `@prisma/dev` dependency to resolve this
- **Deferred**: monitor for prisma update that includes fixed `@hono/node-server`

## Files Changed

| File | Change | Type |
|------|--------|------|
| `hms-backend/package-lock.json` | `hono` 4.12.18 → 4.12.23 | Lockfile update |

No changes to `package.json`, `prisma/schema.prisma`, or any source files.

## Verification

```bash
npm test → 1537/1537 PASS, 77 suites
npm run build → PASS
npx prisma validate → PASS
git diff --check → clean
```

## Evidence

- `docs/evidence/dep-h1-dependency-audit-review.md`
- `docs/evidence/dep-h1-backend-audit.json` (raw audit output)

## Final Verdict

STAGING-ONLY / DEP-H-1 DEPENDENCY AUDIT COMPLETE
