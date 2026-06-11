# Phase 3: Remote CI Activation Execution Checklist

> **For agentic workers:** This document serves as the high-fidelity execution protocol for the first external CI run. Verification should occur task-by-task.

**Goal:** Establish a verified green CI baseline on the remote runner (GitHub Actions/GitLab CI) to act as the automated gatekeeper for the HMS project.

---

## 1. CI Activation Prerequisites
- [ ] **Remote Repository Access**: Confirm the local repository is linked to a remote (e.g., `git remote -v` shows `origin`).
- [ ] **Runner Availability**: Confirm the organization has active GitHub Actions (or equivalent) runners available.
- [ ] **Code Freeze Confirmation**: Verify no feature code changes are pending (tracked working tree should be clean).

## 2. Repo Configuration Checklist
- [ ] **YAML Location**: Ensure `.github/workflows/ci.yml` is present in the latest local commit.
- [ ] **Actions Permissions**: Confirm "Read and write permissions" are enabled in Repository Settings > Actions > General (needed for artifact uploads).
- [ ] **Workflow Dispatch**: (Optional) Confirm the workflow can be triggered manually if needed.

## 3. Secrets/Variables Checklist
- [ ] **JWT_SECRET**: Define in Repository Secrets (e.g., `JWT_SECRET=ci-test-only-secret`).
- [ ] **DATABASE_URL**: The `.github/workflows/ci.yml` currently utilizes a service container (localhost). Ensure no repository-level `DATABASE_URL` secret conflicts with this local service binding.
- [ ] **NODE_VERSION**: Verify the `NODE_VERSION` environment variable in the YAML matches the project baseline (20.x).

## 4. First-Run Execution Checklist
- [ ] **Local Pre-Check**: Run `./scripts/ci-local-validate.sh` one final time to ensure a green local starting point.
- [ ] **The Push**: Push the `main` (or target) branch to `origin`.
- [ ] **The Watch**: Navigate to the "Actions" tab on the remote repository and monitor the "HMS CI Pipeline" execution.

## 5. Expected Jobs & Success Criteria
| Job | Primary Command | Success Definition |
| :--- | :--- | :--- |
| **Lint & Typecheck** | `npm run lint`, `tsc` | 0 errors, 0 warnings (depending on config). |
| **Backend Tests** | `npm run test:e2e` | All Jest suites green; `db-test` container starts/stops. |
| **Frontend Tests** | `npm run test -- --run` | All Vitest suites green in headless mode. |
| **Docker Build** | `docker build` | SUCCESS exit code; OCI images built for both FE and BE. |

## 6. Likely First-Run Failure Points
- **Headless Environment Gaps**: Frontend tests might fail if system dependencies for Playwright/Chromium are missing (though standard `ubuntu-latest` usually has them).
- **Environment Variable Mismatch**: Forgotten `.env.test` dependencies that aren't defined in the CI YAML.
- **Docker Multi-Stage Context**: Build failures if `Dockerfile` references paths outside the build context in a non-standard way.

## 7. Evidence to Capture After First Green Run
- [ ] **Artifact Verification**: Confirm `backend-coverage` zip is available for download in the workflow run summary.
- [ ] **Log Export**: Archive the full console log of the first successful run to `docs/evidence/ci/remote-ci-first-green.log`.
- [ ] **SHA Link**: Map the successful commit SHA to the Production Readiness Evidence Index.

## 8. Go/No-Go Gate for Phase 4 (Staging)
- **Status: GO** if and only if:
    1.  The latest commit has a green checkmark on the remote runner.
    2.  Static analysis, tests, and builds all completed without bypasses.
    3.  All mandatory evidence (coverage artifacts) is generated.
- **Status: NO-GO** if any job fails or if the build succeeds but produces no artifacts.

---

## 9. Final Readiness Verdict
The HMS project is **Remote-CI Ready**. All local groundwork is validated. The moment the repository is pushed to a remote host with active runners, the automation gatekeeper will be established.
