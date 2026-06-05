# HYGIENE-H-1 — Repo Evidence / Junk File Audit

## Phase

HYGIENE-H-1 — Repo Evidence / Junk File Audit

## Branch

`hygiene/hygiene-h1-repo-evidence-junk-audit`

## Scope

- Repository hygiene only.
- Evidence/junk classification.
- No app behavior changes.
- No backend business logic changes.
- No frontend changes.
- No Prisma schema/migration changes.
- No deployment changes.
- No dependency changes.
- STAGING-ONLY.

## Baseline Inventory

| Metric | Count |
|--------|-------|
| Suspicious files scanned (by extension) | 27 |
| Large files (>100KB) found | 8 |
| Log files found | 15 |
| Scratch/debug candidates found | 3 |
| Generated/pulled artifact candidates | 4 |
| Duplicate template files found | 2 |

## Classification Table

| File | Size | Type | Finding | Classification | Action | Rationale |
|------|------|------|---------|---------------|--------|-----------|
| `hms-backend/billing-di-error.log` | 8KB | Binary log | UTF-16 encoded PowerShell error dump from local Jest config validation failure | DELETE | Deleted | Unreferenced local troubleshooting artifact; no evidentiary value |
| `hms-backend/check-col.js` | 317B | JS script | One-off scratch script querying `information_schema.columns` for `failed_login_attempts` | DELETE | Deleted | Unreferenced one-time debug script; no ongoing value |
| `hms-backend/pulled_schema.prisma` | 172KB | Prisma schema | UTF-16 encoded generated schema dump from remote database (1974 lines) | DELETE | Deleted | Stale duplicate of `prisma/schema.prisma`; unreferenced; no value |
| `hms-backend/templates/templates/inventory_items.csv` | 411B | CSV | Identical duplicate of `hms-backend/templates/inventory_items.csv` | DELETE | Deleted | Copy-paste artifact in nested `templates/templates/` dir; unreferenced |
| `hms-backend/templates/templates/service_items.csv` | 565B | CSV | Identical duplicate of `hms-backend/templates/service_items.csv` | DELETE | Deleted | Copy-paste artifact in nested `templates/templates/` dir; unreferenced |
| `hms-backend/stress-cashier-results.json` | 506B | JSON | Stress test result output from Cashier Session Close test | KEEP AS EVIDENCE | Kept | Referenced by `hms-backend/scripts/stress-cashier-close.ts` and `docs/stress-testing.md` |
| `hms-backend/stress-payment-results.json` | 4KB | JSON | Stress test result output from Payment Idempotency test | KEEP AS EVIDENCE | Kept | Referenced by `hms-backend/scripts/stress-payment-idempotency.ts` and `docs/stress-testing.md` |
| `hms-backend/stress-refresh-results.json` | 2KB | JSON | Stress test result output from Refresh Token test | KEEP AS EVIDENCE | Kept | Referenced by `hms-backend/scripts/stress-refresh-tokens.ts` and `docs/stress-testing.md` |
| `docs/evidence/security/*.log` (15 files) | Various | Log files | GH CLI logs, gitleaks logs, PR merge logs from remediation/rotation process | KEEP AS EVIDENCE | Kept | Intentional audit trail evidence documenting PR #43-#46 remediation and secret rotation |
| `docs/evidence/security/*.txt` (excluding selectstring) | Various | Text files | Git logs, commit messages, scan results from remediation evidence | KEEP AS EVIDENCE | Kept | Intentional security audit trail evidence |
| `docs/evidence/security/rotation/` | Dir | Evidence dir | Rotation evidence: k8s apply scripts, gh-secrets metadata, git logs, rotation summaries | KEEP AS EVIDENCE | Kept | Intentional rotation evidence documenting GitHub Secrets rotation process |
| `docs/evidence/security/selectstring-secrets.txt` | 158KB | Text | Raw `Select-String` secrets scan output from ANOTHER project directory (`D:\Vscode\hms-login-design\`) | NEEDS CONTEXT | Unchanged | Contains scan output from different project; may contain test CI secrets from that project. Origin unclear — not deleted without confirmation |
| `docs/final_master_track_summary.txt` | 2KB | Text | Summary of completed AutoDraft + Security Hardening tracks | KEEP AS EVIDENCE | Kept | Legitimate project summary document |
| `docs/silent-bug-hunter-verification-report.txt` | 48KB | Text | Detailed bug hunt verification report | KEEP AS EVIDENCE | Kept | Legitimate bug hunting report documenting findings |
| `docs/silent-bug-hunter-patch-commander-report.txt` | 56KB | Text | Detailed patch commander bug hunting report | KEEP AS EVIDENCE | Kept | Legitimate bug hunting report documenting findings |
| `hms-frontend/public/hospital-bg.png` | 661KB | PNG | Hospital background image used in frontend | KEEP | Kept | Intentional frontend asset |
| `hms-frontend/src/assets/hero.png` | — | PNG | Hero image used in frontend | KEEP | Kept | Intentional frontend asset |

## Files Deleted

1. **`hms-backend/billing-di-error.log`** — 8KB binary PowerShell error dump from local Jest validation. Unreferenced. Clear local troubleshooting artifact.
2. **`hms-backend/check-col.js`** — 317B one-off scratch script querying database schema. Unreferenced. No ongoing value.
3. **`hms-backend/pulled_schema.prisma`** — 172KB UTF-16 encoded stale generated schema dump. Unreferenced. Duplicate of `prisma/schema.prisma`.
4. **`hms-backend/templates/templates/inventory_items.csv`** — 411B identical duplicate of `templates/inventory_items.csv`. Copy-paste artifact.
5. **`hms-backend/templates/templates/service_items.csv`** — 565B identical duplicate of `templates/service_items.csv`. Copy-paste artifact.

## Files Kept as Evidence

- `hms-backend/stress-*-results.json` (3 files) — Referenced by scripts and stress testing docs.
- `docs/evidence/security/*.log` (15 files) — Security remediation PR evidence (PRs #43-#46).
- `docs/evidence/security/*.txt` (14 files) — Git logs, commit messages, scan results from remediation.
- `docs/evidence/security/rotation/` (15 files) — Secret rotation evidence including gh-secrets metadata and k8s scripts.
- `docs/final_master_track_summary.txt` — Project completion summary.
- `docs/silent-bug-hunter-*.txt` (2 files) — Bug hunting evidence.

## Files Marked NEEDS CONTEXT

1. **`docs/evidence/security/selectstring-secrets.txt`** (158KB) — Raw `Select-String` output scanning a DIFFERENT project directory (`D:\Vscode\hms-login-design\`). Contains test CI secrets from that project. Not clearly intentional in this repo's evidence. Left unchanged — needs product owner confirmation before deletion.

## Files Marked SECURITY REVIEW

None identified in source files. All found secret patterns are:
- `${VAR:?error}` env variable references (docker-compose)
- `${{ secrets.* }}` GitHub Secrets references (workflows)
- Test-only placeholder values (`test-secret-key-for-e2e-tests`, `postgresql://test:test@localhost`)
- `PLACEHOLDER_*` values in k8s manifests

No real production secrets, private keys, or PHI found.

## .gitignore Review

### Corruption Found
**Yes** — Two lines had null-byte (UTF-16) encoding corruption:
- `.gemini/` was stored as `. \0 g \0 e \0 m \0 i \0 n \0 i \0 / \0`
- `.cursor/` was stored as `. \0 c \0 u \0 r \0 s \0 o \0 r \0 / \0`

These null bytes prevented the ignore rules from working correctly.

### Changes Made
- Stripped null bytes from `.gitignore` to restore proper UTF-8 encoding.
- Normalized line endings (removed trailing CR from `*.dump` line).
- No new ignore patterns added.

### Current .gitignore Rules
```
node_modules/
dist/
.env
.DS_Store
**/*.tsbuildinfo
.gemini/
.cursor/
.env.production
temp_repo_hms
coverage/
e2e/test-results/
test-results/
runtime-qa-logs/

# Backup artifacts
backups/
*.sql
*.dump
```

## Secret/PHI Scan

### Commands Run
```bash
# Secret patterns in source files
rg -n --hidden --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!package-lock.json' 'DATABASE_URL|JWT_SECRET|MASTER_MFA_KEY|PRIVATE KEY|BEGIN RSA|BEGIN OPENSSH' .

# PHI patterns in docs, backend, frontend, scripts
rg -n --hidden --glob '!node_modules' --glob '!dist' --glob '!coverage' "John Doe|Jane Doe|birthdate|medical record|MRN|PhilHealth" .
```

### Result Summary
- No real production secrets found in source files.
- All `DATABASE_URL`/`JWT_SECRET`/`MASTER_MFA_KEY` references are either:
  - Environment variable references (`${VAR:?error}`)
  - GitHub Secrets placeholders (`${{ secrets.* }}`)
  - Test/CI placeholder values (`test-secret-key-for-e2e-tests`, `postgresql://test:test@localhost`)
  - Documentation explaining configuration requirements
- No private keys found.
- Only PHI-related content is "Jane Doe" in a test file (test placeholder) and references to "medical records" in documentation context.
- No real patient PHI discovered.

## Verification Commands

```bash
git status --short
  # Result: 5 deleted, 1 modified (.gitignore), untracked scratch files

git diff --cached --stat
  # Result: 5 files deleted (19 deletions), .gitignore changed

git diff --name-only
  # Result: .gitignore

git diff --check
  # Result: clean

# Branding/public-claims grep
git grep -n "HIPAA Compliant\|SOC2 Certified\|SOC 2 Certified\|Enterprise Ready\|Built for Production\|Production Ready" -- docs/ hms-frontend/ hms-backend/
  # Result: All matches are defensive disclaimers, classification matrices, or guard documentation. No false claims.
```

## Final Verdict

STAGING-ONLY / HYGIENE-H-1 REPO AUDIT COMPLETE
