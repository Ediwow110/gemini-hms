Rotation Playbook — Secrets & Key Rotation

Purpose
Prepare an auditable, repeatable playbook to rotate exposed secrets discovered by gitleaks and to update secret stores (GitHub, K8s, DB, SSH) without committing secrets to the repository.

Scope
- JWT secrets, refresh tokens, DB passwords, TOTP/MFA keys, SSH deploy keys, Kubernetes secrets used by deployments.

High-level steps
1. Prepare new secrets (generate securely)
   - Cross-platform generator examples:
     - OpenSSL: openssl rand -base64 48
     - Python: python -c "import secrets; print(secrets.token_urlsafe(48))"
     - Node: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   - Record each secret only in a secure secrets manager or ephemeral vault; do NOT write to repo.

2. Update CI/Repo secrets (GitHub)
   - Command: gh secret set CI_JWT_SECRET --body "$NEW_JWT_SECRET" --repo OWNER/REPO
   - Repeat for: CI_JWT_REFRESH_SECRET, CI_DATABASE_URL, etc.
   - Verify: gh secret list --repo OWNER/REPO

3. Update Infrastructure secrets (Kubernetes or Cloud Secret Manager)
   - Kubernetes (example):
     kubectl -n <ns> create secret generic app-secrets --from-literal=JWT_SECRET="$NEW_JWT_SECRET" --dry-run=client -o yaml | kubectl apply -f -
     kubectl rollout restart deployment/<backend-deployment> -n <ns>
   - GCP Secret Manager / AWS Secrets Manager: use provider CLI/API to create new secret version and update referencing services.

4. Rotate DB credentials (Postgres example)
   - Generate new strong password and store in secret manager.
   - On DB: ALTER USER app_user WITH PASSWORD 'NEW_PASSWORD';
   - Update secret store (CI secret + k8s) with new DATABASE_URL or connection string.
   - Apply in a canary: update staging first, verify, then prod.

5. Rotate SSH deploy key
   - Create new SSH key-pair; add public key to target server(s) authorized_keys, add private key to GitHub Secrets as SSH_PRIVATE_KEY.
   - Verify SSH step with a nondestructive command (ls /tmp) before using for deploy.

6. Verification & Smoke Tests
   - Run staging smoke tests: /health, auth flow, DB read/write, E2E smoke subset.
   - Validate logs for secret-related errors.
   - Verify SLI/SLO and watch for increased latency/Error budget.

7. Rollback plan
   - Keep previous secret stored as a retired version in secret manager (with restricted access) for at least 1 hour during rotate window.
   - To rollback: restore previous secret version in secret manager (or update k8s secret) and restart deployment.

8. Audit & Evidence
   - Record rotation event in docs/evidence/security/rotation-log.csv with: timestamp, secret-name, rotated-by, verification-status, rollback-window.
   - Attach related CI run ids and staging test results to the rotation event.

Owner matrix (suggested)
- Rotate DB passwords: DB/Platform Lead (db-lead@EXAMPLE)
- Rotate JWT/TOTP keys: Security Lead (security-lead@EXAMPLE)
- Update GitHub Secrets: DevOps Lead (devops-lead@EXAMPLE)
- Update K8s secrets & rollout: Observability/Platform (obs-lead@EXAMPLE)
- PR / repo changes (non-secret): Documentation Lead (docs-lead@EXAMPLE)

Runbook checklist (pre-rotate)
- [ ] Confirm maintenance window and notify stakeholders
- [ ] Ensure backup & current restore procedure validated within last 7 days
- [ ] Prepare staging canary and smoke tests
- [ ] Ensure all changes are scripted and peer-reviewed

Notes & cautions
- Do NOT paste secret values into chat, PRs, or commit messages.
- History purge is a separate, high-impact step and requires a coordinated force push and a communication plan — request separately.

Sample quick commands summary
- Generate secret: python -c "import secrets; print(secrets.token_urlsafe(48))"
- Set GitHub secret: gh secret set CI_JWT_SECRET --body "${NEW_JWT_SECRET}" --repo OWNER/REPO
- Update k8s secret and restart: kubectl -n $NS create secret generic app-secrets --from-literal=JWT_SECRET="$NEW_JWT_SECRET" --dry-run=client -o yaml | kubectl apply -f - && kubectl rollout restart deployment/$DEPLOYMENT -n $NS
- DB rotation snippet (Postgres): psql -U admin -d template1 -c "ALTER USER app_user WITH PASSWORD 'NEW_PASSWORD';"

File saved: docs/evidence/security/rotation-playbook.md
