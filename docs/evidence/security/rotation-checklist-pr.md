Rotation Checklist PR — Assign Owners and Link Remediation Work

Date: 2026-05-18
Repository: https://github.com/Ediwow110/gemini-hms

Purpose
Create a single checklist PR that assigns owners, schedules the rotation run, and links the remediation PRs and runbooks so the team can execute secret rotation and capture evidence.

Summary
This checklist coordinates the secret-rotation tasks that follow remediation PRs: PR #43 (remove .env.production), PR #44 (replace inline workflow secrets), PR #45 (add rotation playbook). Use this PR to assign owners, set the maintenance window, and track evidence in docs/evidence/security/rotation/.

Links (evidence & remediation)
- Remediation PRs:
  - PR #43: https://github.com/Ediwow110/gemini-hms/pull/43
  - PR #44: https://github.com/Ediwow110/gemini-hms/pull/44
  - PR #45: https://github.com/Ediwow110/gemini-hms/pull/45
- Rotation playbook: docs/evidence/security/rotation-playbook.md
- Rotation run (script): docs/evidence/security/rotation-run.md
- Gitleaks report: docs/evidence/security/gitleaks-report.json

Checklist (mark items as assigned / done)
1. Confirm remediation PRs merged and branches deleted (Owner: Release Manager)
   - [ ] Confirm PR #43 merged
   - [ ] Confirm PR #44 merged
   - [ ] Confirm PR #45 merged
2. Schedule maintenance window and notify stakeholders (Owner: Release Manager)
   - [ ] Set date/time and publish to on-call and stakeholders
3. Prepare secrets (Owner: Security Lead)
   - [ ] Generate new secrets for JWT, Refresh, DB, SSH, TOTP
   - [ ] Store securely in vault (Vault/Cloud Secret Manager)
4. Update GitHub repository secrets (Owner: DevOps Lead)
   - [ ] CI_JWT_SECRET, CI_JWT_REFRESH_SECRET
   - [ ] CI_DATABASE_URL (staging), PRODUCTION_JWT_SECRET, PRODUCTION_JWT_REFRESH_SECRET
   - [ ] SSH_PRIVATE_KEY, MASTER_MFA_KEY, TOTP_ENCRYPTION_KEY
5. Apply secrets to staging and verify (Owner: Platform/Observability)
   - [ ] Apply k8s secrets to staging and restart backend
   - [ ] Run staging smoke tests (QA)
   - [ ] Capture logs and attach to docs/evidence/security/rotation/<timestamp>/
6. Rotate DB credentials in staging canary and verify (Owner: DB/Platform Lead)
   - [ ] Rotate password or create new DB user; update secret store
   - [ ] Run migration/connection smoke tests
7. Promote rotation to production (Owner: DevOps Lead)
   - [ ] Apply production secrets to secret store or k8s
   - [ ] Gradual rollout (canary/rolling) and verify health
8. Post-rotation verification and evidence capture (Owner: QA/Release Manager)
   - [ ] Healthcheck results
   - [ ] Smoke test logs
   - [ ] Rollout/rollbacks if needed
   - [ ] Append rotation event to docs/evidence/security/rotation-log.csv
9. Finalize and close event (Owner: Release Manager)
   - [ ] Record time, approvers, and attach evidence (CI run ids, logs, screenshots)
   - [ ] Confirm no regressions in CI and production

Owner Matrix (suggested contact placeholders)
- Release Manager: release-manager@EXAMPLE (owner: schedule & final sign-off)
- DevOps Lead: devops-lead@EXAMPLE (owner: GitHub secrets & prod rollout)
- Security Lead: security-lead@EXAMPLE (owner: generate & verify secrets)
- DB/Platform Lead: db-lead@EXAMPLE (owner: DB rotation)
- Platform/Observability: obs-lead@EXAMPLE (owner: k8s secrets & dashboards)
- QA Lead: qa-lead@EXAMPLE (owner: staging/prod smoke tests)

Request
Please assign the owners above (or replace with correct contacts), set a target maintenance window, and request reviewers from Security, DevOps, and Release Management.

Evidence
After each major step, drop outputs into: docs/evidence/security/rotation/<YYYY-MM-DD-HHMMSS>/ and update this checklist with links.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
