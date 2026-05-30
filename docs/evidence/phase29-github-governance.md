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
| PR template usage | NOT CONFIGURED | No `PULL_REQUEST_TEMPLATE.md` found. |
| Public claims hygiene requirement | DOCUMENTED | CI verifier checks for unsupported claims. `docs/client-handoff/` uses disclaimer framing. |
| Manual settings required | YES | Branch protection, required CI checks, required reviews, and CODEOWNERS must be configured in GitHub repo settings. |

## Key Gaps

1. **No branch protection**: Main branch is unprotected. This is the highest-priority governance gap. A developer can push directly to main without CI, review, or Docker build.
2. **No required reviews**: While all recent PRs have been reviewed by this agent, there is no enforcement mechanism.
3. **No CODEOWNERS**: No automated ownership mapping for code review.
4. **No PR template**: No standardized PR description format enforced.
5. **No required status checks**: CI and Docker build run but are not configured as required checks for merge.

## Recommendations

1. Enable branch protection on `main`:
   - Require pull request reviews (at least 1)
   - Require status checks (CI guard, frontend, backend, verifiers + Production Docker Build)
   - Require branches to be up to date
   - Restrict direct pushes
2. Add `CODEOWNERS` file for automated review routing.
3. Add `PULL_REQUEST_TEMPLATE.md` for standardized PR descriptions.
4. Configure squash merge as the only allowed merge method (already used by convention).

## Final Verdict

- [x] PASS (documentation only)
- [ ] FAIL
- [ ] BLOCKED

## Notes

Governance relies on convention rather than enforcement. Branch protection and required status checks must be configured in GitHub repo settings (requires admin access). This document does not imply that governance enforcement is in place.

System remains **STAGING-ONLY**.
