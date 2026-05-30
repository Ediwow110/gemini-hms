# Phase 29 GitHub Governance Evidence

## Scope

This document records GitHub repository governance and branch protection readiness.

## Environment

| Field | Value |
|---|---|
| Date | 2026-05-30 |
| Repository | Ediwow110/gemini-hms |
| Default branch | main |

## Required Evidence

| Check | Status | Evidence |
|---|---|---|
| Main branch protection | NOT ENABLED | `gh api repos/.../branches/main/protection` returns 404. No branch protection rules configured. |
| PR requirement status | NOT ENABLED | Direct pushes to main are possible. All recent work has used PRs by convention, not enforcement. |
| Required CI checks | NOT ENABLED | CI and Docker build run on PRs but are not required at merge. |
| Required Docker build | NOT ENABLED | See above. |
| Direct push restriction | NOT ENABLED | Main branch allows direct pushes. |
| Review requirement status | NOT ENABLED | No required reviewers. |
| Squash merge policy | ENABLED | All Phase 29 PRs merged via squash merge. |
| Auto-merge status | NOT ENABLED | Not configured. |
| Secrets exposure policy | DOCUMENTED | CI uses GitHub Secrets for env vars. `.env` files in `.gitignore`. No committed secrets in repo (verified by guard job). |
| Release checklist usage | DOCUMENTED | Phase 29D runbooks include release checklists. |
| PR template usage | CONFIGURED | `.github/pull_request_template.md` exists with comprehensive checklists for change type, security, database, deployment, and final verdict. |
| CODEOWNERS | CONFIGURED | `.github/CODEOWNERS` added in ND-2 PR. Default owner `@Ediwow110` with per-path rules for backend, frontend, CI, deployment, documentation. |
| Branch protection config file | PRESENT | `.github/branch-protection.json` defines required checks (guard, build, frontend, backend, verifiers), required PR review (1), dismiss stale, enforce admins, linear history, no force pushes, no deletions. Manual application still required in GitHub settings. |
| Public claims hygiene requirement | DOCUMENTED | CI verifier checks for unsupported claims. `docs/client-handoff/` uses disclaimer framing. |
| Manual settings required | YES | Branch protection, required CI checks, required reviews, and CODEOWNERS must be configured in GitHub repo settings. |

## Key Gaps

1. **Branch protection not enforced**: Configuration file exists (`.github/branch-protection.json`) but must be manually applied in GitHub repo settings. Admin access required.
2. **No required reviews (enforced)**: While all recent PRs have been reviewed by this agent, there is no enforcement mechanism.
3. **Required status checks not enforced**: CI and Docker build run but are not configured as required checks for merge. Must be configured in GitHub settings.

## Status Updates (ND-2)

| Item | Before ND-2 | After ND-2 |
|---|---|---|
| PR template | Missing | Created: `.github/pull_request_template.md` with comprehensive checklists |
| CODEOWNERS | Missing | Created: `.github/CODEOWNERS` with `@Ediwow110` as default + per-path rules |
| Branch protection config | Partial | Updated: `.github/branch-protection.json` includes all 5 checks (guard, build, frontend, backend, verifiers) |
| Branch protection enforcement | Not enabled | Still requires manual application in GitHub repo settings (admin access) |

## Recommendations

1. **Apply branch protection in GitHub settings using `.github/branch-protection.json` as the reference**:
   - Require pull request reviews (at least 1)
   - Require status checks (guard, build, frontend, backend, verifiers)
   - Require branches to be up to date
   - Restrict direct pushes
   - Dismiss stale reviews
   - Require conversation resolution
   - Enforce for admins
   - Disable force pushes
   - Disable branch deletion
2. Configure squash merge as the only allowed merge method (already used by convention).

## Final Verdict

- [x] PASS (documentation + config files)
- [ ] FAIL
- [ ] BLOCKED

## Notes

Governance configuration files (CODEOWNERS, branch-protection.json, PR template) are now in place. Manual application in GitHub repo settings is still required to enforce branch protection and required checks. Admin access to the repository is needed.

System remains **STAGING-ONLY**.
