Secret Rotation Run — Scripted Commands & Verification
Date: 2026-05-18
Repo: https://github.com/Ediwow110/gemini-hms

Purpose
This document is an auditable, runnable checklist and command set to rotate exposed secrets and validate the rotation. No secret values are included here — all commands use placeholder variables that must be provided securely at runtime.

Prerequisites
- GitHub CLI (gh) authenticated as a repo admin
- kubectl configured for staging and prod clusters
- psql/DB admin access
- SSH access to deploy targets
- Python 3 available for secure secret generation
- Maintenance window and stakeholder notifications complete
- Recent successful backup + restore verification (within 7 days)

Owners (suggested)
- DevOps Lead: devops-lead@EXAMPLE
- Security Lead: security-lead@EXAMPLE
- DB/Platform Lead: db-lead@EXAMPLE
- Release Manager: release-manager@EXAMPLE

Pre-Rotation Checklist
- [ ] Announce maintenance window to stakeholders
- [ ] Verify backups + ran restore test within 7 days
- [ ] Confirm rollback/restore contacts are on-call
- [ ] Stage environment ready and smoke tests defined
- [ ] Copy this runbook and record start time in docs/evidence/security/rotation-log.csv

High-Level Sequence
1. Generate new secrets (staging & prod variants)
2. Update GitHub repository secrets (CI/staging/prod placeholders)
3. Update staging k8s / secret-store and verify staging
4. Rotate DB credentials in canary/staging, verify
5. Rotate SSH deploy key (if applicable)
6. Promote to production: update secret store, restart/rollout, verify
7. Capture evidence and close rotation event

Commands (examples — replace placeholders)

A. Generate secrets (cross-platform via Python)
# Bash example
NEW_JWT_SECRET=$(python -c "import secrets,sys; sys.stdout.write(secrets.token_urlsafe(48))")
NEW_JWT_REFRESH_SECRET=$(python -c "import secrets,sys; sys.stdout.write(secrets.token_urlsafe(64))")
NEW_DB_PASSWORD=$(python -c "import secrets,sys; sys.stdout.write(secrets.token_urlsafe(24))")

# PowerShell example
$NEW_JWT_SECRET = (python -c "import secrets,sys; sys.stdout.write(secrets.token_urlsafe(48))")
$NEW_DB_PASSWORD = (python -c "import secrets,sys; sys.stdout.write(secrets.token_urlsafe(24))")

Store each generated secret immediately in a secure vault (HashiCorp Vault, AWS/GCP/Azure Secret Manager) or keep ephemeral in a secure CLI session.

B. Update GitHub repository secrets (CI/staging placeholders)
# Replace OWNER/REPO with Ediwow110/gemini-hms
gh secret set CI_JWT_SECRET --body "$NEW_JWT_SECRET" --repo OWNER/REPO
gh secret set CI_JWT_REFRESH_SECRET --body "$NEW_JWT_REFRESH_SECRET" --repo OWNER/REPO
gh secret set CI_DATABASE_URL --body "postgresql://app_user:$NEW_DB_PASSWORD@db-host:5432/gemini_prod" --repo OWNER/REPO
# Other secrets
gh secret set SSH_PRIVATE_KEY --body "$(cat /path/to/new_deploy_key)" --repo OWNER/REPO
gh secret set MASTER_MFA_KEY --body "$NEW_MFA_KEY" --repo OWNER/REPO

C. Update staging Kubernetes secrets (dry-run then apply)
kubectl -n staging create secret generic app-secrets \
  --from-literal=JWT_SECRET="$NEW_JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$NEW_JWT_REFRESH_SECRET" \
  --from-literal=DATABASE_URL="postgresql://app_user:$NEW_DB_PASSWORD@db-host:5432/gemini_prod" \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n staging rollout restart deployment/hms-backend
kubectl -n staging rollout status deployment/hms-backend --timeout=120s

D. Rotate DB credentials (recommended: create new DB user or rotate password safely)
# Option 1: Change app user password (coordination required)
PGPASSWORD=$DB_ADMIN_PASSWORD psql -h <db-host> -U <db-admin> -c "ALTER USER app_user WITH PASSWORD '$NEW_DB_PASSWORD';"
# Update secret manager / k8s secret with new DATABASE_URL (see step C)
# Restart backend pods (rolling) after secret update
kubectl -n staging rollout restart deployment/hms-backend

E. Rotate SSH deploy key (example)
ssh-keygen -t ed25519 -f ./deploy_new_key -C "deploy@$(date -Iseconds)" -N ""
# Upload public key to target hosts (example using ssh-copy-id or manual append)
# Add private key to GitHub Secrets
gh secret set SSH_PRIVATE_KEY --body "$(cat ./deploy_new_key)" --repo OWNER/REPO

F. Verification — staging
# Check GH secrets present
gh secret list --repo OWNER/REPO
# Check k8s secret exists (does not reveal value)
kubectl -n staging get secret app-secrets -o yaml
# Verify pod rollout and readiness
kubectl -n staging rollout status deployment/hms-backend
kubectl -n staging get pods -l app=hms-backend
# Health endpoint
curl -fS https://staging.example.com/health || (echo "healthcheck failed"; exit 1)
# Minimal smoke test (team-defined)
cd hms-backend && npm run test:e2e -- --grep smoke --runInBand
# Check logs for auth/db errors
kubectl -n staging logs deployment/hms-backend --since=5m | grep -i "error\|auth\|connection" || true

G. Promote to production (only after staging verification)
# Update production secret store (cloud secret manager or k8s in prod)
kubectl -n production create secret generic app-secrets \
  --from-literal=JWT_SECRET="$NEW_JWT_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$NEW_JWT_REFRESH_SECRET" \
  --from-literal=DATABASE_URL="postgresql://app_user:$NEW_DB_PASSWORD@prod-db-host:5432/gemini_prod" \
  --dry-run=client -o yaml | kubectl apply -f -
# Restart production backends gracefully (canary/rolling)
kubectl -n production rollout restart deployment/hms-backend
kubectl -n production rollout status deployment/hms-backend --timeout=300s
# Run production smoke checks (minimal)
curl -fS https://api.prod.example.com/health || (echo "prod health failed"; exit 1)

H. Evidence capture (required)
mkdir -p docs/evidence/security/rotation/$(date +%F-%H%M%S)
# Save outputs from the verification steps into the evidence folder
kubectl -n production rollout status deployment/hms-backend --timeout=300s > docs/evidence/security/rotation/$(date +%F-%H%M%S)/rollout.txt
curl -sS https://api.prod.example.com/health > docs/evidence/security/rotation/$(date +%F-%H%M%S)/health.json
# Append to rotation log CSV
echo "$(date -Is),$USER,JWT_SECRET,rotate,VERIFIED" >> docs/evidence/security/rotation-log.csv

I. Rollback plan (short window)
- Keep previous secret versions in secret manager as a "previous" version for at least 1 hour.
- To rollback: update secret store with previous secret value and restart deployment: kubectl -n production rollout restart deployment/hms-backend
- For DB rollback: if password rotated, be able to run ALTER USER app_user WITH PASSWORD 'OLD_PASSWORD' from DB admin account.
- If SSH key rotation fails, re-add previous authorized_key entry to target hosts and re-run deployment.

J. Post-Rotation steps
- Rotate again after history purge (if purge performed) to ensure leaked values are invalidated everywhere
- Run full CI test-suite (unit + integration + e2e) and attach logs to docs/evidence/tests/
- Close rotation event in docs/evidence/security/rotation-log.csv with verification status and PR links

Safety Notes
- Do NOT paste secret values into PRs, issue trackers, or chat.
- Coordinate a short maintenance window for production rotations.
- If high-risk (DB primary), perform canary first on a read replica or staging clone.

Appendix: Quick GH secret template (fill values securely)
# Example secrets to set
CI_JWT_SECRET
CI_JWT_REFRESH_SECRET
CI_DATABASE_URL
PRODUCTION_JWT_SECRET
PRODUCTION_JWT_REFRESH_SECRET
SSH_PRIVATE_KEY
MASTER_MFA_KEY
TOTP_ENCRYPTION_KEY

Saved: docs/evidence/security/rotation-run.md
