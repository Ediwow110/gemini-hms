## Summary

- Audits repository hygiene artifacts such as logs, scratch scripts, generated dumps, stress outputs, and evidence files.
- Classifies suspicious files as KEEP, KEEP AS EVIDENCE, MOVE/RENAME, DELETE, NEEDS CONTEXT, or SECURITY REVIEW.
- Removes only clearly identified junk artifacts.
- Updates `.gitignore` to fix null-byte encoding corruption.
- Adds HYGIENE-H-1 evidence report.

## Scope

- Repository hygiene only.
- No app behavior changes.
- No backend business logic changes.
- No frontend changes.
- No Prisma schema/migration changes.
- No deployment changes.
- No dependency changes.
- No production-readiness claim.
- No HIPAA/SOC 2 claim.

## Classification Summary

- Files scanned: 17 suspicious candidates
- Files deleted: 5
- Files kept as evidence: 35
- Files marked NEEDS CONTEXT: 1
- Files marked SECURITY REVIEW: 0

## Files Deleted

| File | Size | Reason |
|------|------|--------|
| `hms-backend/billing-di-error.log` | 8KB | Local PowerShell error dump; unreferenced |
| `hms-backend/check-col.js` | 317B | One-off scratch script; unreferenced |
| `hms-backend/pulled_schema.prisma` | 172KB | Stale generated schema dump; duplicate |
| `hms-backend/templates/templates/inventory_items.csv` | 411B | Identical duplicate |
| `hms-backend/templates/templates/service_items.csv` | 565B | Identical duplicate |

## .gitignore Fix

- Removed null-byte (UTF-16) corruption in `.gemini/` and `.cursor/` lines that prevented them from working.
- Normalized line endings.
- No new ignore patterns added.

## Verification

- `git diff --check`: clean
- `git diff --name-only`: 7 files changed (5 deleted, 1 .gitignore fixed, 1 evidence added)
- public-claims grep: all references are defensive disclaimers (no false claims)
- secret/PHI scan: no real secrets or PHI found

## Evidence

- `docs/evidence/hygiene-h1-repo-evidence-junk-audit.md`

## Verdict

STAGING-ONLY / HYGIENE-H-1 REPO AUDIT COMPLETE
