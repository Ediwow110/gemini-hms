# Staging Environment Provisioning Checklist (Execution-Ready)

**Status:** Operator execution checklist; verify live provisioning before every deployment.
**Authority:** `docs/infrastructure/staging-provisioning-handoff.md` and the current staging workflow.
**Aligned to:** `.github/workflows/deploy-staging.yml` in the current release candidate.

This checklist is the execution-ready step-by-step for Platform/DevOps to provision
the staging environment. Every secret name must match the literal references in
`deploy-staging.yml`. Every step is testable with a single command.

---

## A. Provisioning Sequence (in dependency order)

### Step 1 — Provision staging Linux VM

- [ ] Choose host (cloud VM, bare-metal, or container host).
- [ ] Minimum specs: 2 vCPU, 4 GB RAM, 20 GB SSD.
- [ ] OS: Linux (Ubuntu 22.04 LTS or Debian 12 recommended).
- [ ] Required packages installed:
  - `docker-ce` (Engine 24+)
  - `docker-compose-plugin` (Compose v2 — note: v2 ships as a Docker plugin, not the legacy `docker-compose` binary)
  - `openssh-server` (for GitHub Actions runner)
  - `curl`, `rsync`, `git`
- [ ] SSH service running and reachable on port 22 from the internet (for GHA runner egress).
- [ ] Dedicated `deploy` user created with passwordless sudo for `docker` (or membership in `docker` group).
- [ ] Authorize the **GitHub Actions runner public SSH key** in `~deploy/.ssh/authorized_keys`.
- [ ] Open inbound ports: 22 (SSH), 80 (frontend HTTP), 443 (frontend HTTPS via reverse proxy).
- [ ] Capture: `STAGING_SSH_HOST` = public IP or DNS name.
- [ ] Capture: `STAGING_SSH_USER` = `deploy`.
- [ ] Generate: `STAGING_SSH_PRIVATE_KEY` = private key whose public half is in `authorized_keys`.

Verify: `ssh deploy@$STAGING_SSH_HOST "docker --version && docker compose version"` returns both versions.

---

### Step 2 — Provision staging PostgreSQL 15 database

- [ ] PostgreSQL 15 instance (managed RDS, or container on the staging host itself).
- [ ] Database name: `hms_staging`.
- [ ] Database user: `staging_user`.
- [ ] Password: 32+ characters, auto-generated (use `openssl rand -base64 32`).
- [ ] **Isolated from production** (separate credentials, separate host).
- [ ] Network ACL: only the staging backend container/host can reach port 5432.
- [ ] Capture:
  - `STAGING_DATABASE_URL` = `postgresql://staging_user:<password>@<host>:5432/hms_staging?schema=public`
  - `STAGING_DB_USER` = `staging_user`
  - `STAGING_DB_PASSWORD` = (the auto-generated password)
  - `STAGING_DB_NAME` = `hms_staging`

Verify: `psql "$STAGING_DATABASE_URL" -c "SELECT version();"` returns `PostgreSQL 15.x`.

---

### Step 3 — Generate staging application secrets

- [ ] `STAGING_JWT_SECRET` — 64-char hex (`openssl rand -hex 32`).
- [ ] `STAGING_JWT_REFRESH_SECRET` — 64-char hex, **must differ from JWT_SECRET**.
- [ ] `STAGING_MASTER_MFA_KEY` — 32-byte key (base64 or hex).
- [ ] `STAGING_AUDIT_CHAIN_SECRET` — independent 32-byte audit signing key.
- [ ] `STAGING_REDIS_URL` — dedicated staging Redis endpoint.
- [ ] `STAGING_REDIS_TLS_CA_BASE64` — private CA only when the Redis service requires it.
- [ ] `STAGING_CORS_ORIGINS` = exact staging frontend URL, e.g. `https://staging.gemini-hms.example.com`.

**Hard rules (enforced by secret separation table in handoff doc §4.3):**
- These values MUST differ from CI secrets (`CI_JWT_SECRET`, etc.).
- These values MUST differ from production secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `MASTER_MFA_KEY`).
- Never reuse across tiers.

---

### Step 4 — Create DNS records

- [ ] `staging.gemini-hms.example.com` → A record → staging host public IP (frontend).
- [ ] `staging-api.gemini-hms.example.com` → A record → staging host public IP (backend; can be same host).
- [ ] TLS certificates provisioned (Let's Encrypt or equivalent).

Verify:
- `nslookup staging-api.gemini-hms.example.com` returns the public IP.
- `curl -fI https://staging-api.gemini-hms.example.com/api/v1/health` returns `HTTP/2 200` only after PostgreSQL and Redis are ready.

---

### Step 5 — Create GitHub `Staging` environment

- [ ] In repo https://github.com/Ediwow110/gemini-hms/settings/environments, click **New environment**.
- [ ] Name: `Staging` (exact case).
- [ ] Require an approved reviewer for staging promotion where team policy requires it.
- [ ] Restrict deployment branches to approved release branches.
- [ ] Confirm with `gh api repos/Ediwow110/gemini-hms/environments | jq '.[].name'` — must list `["Preview", "Production", "Staging"]`.

---

### Step 6 — Add staging secrets to the GitHub environment

**Core (11) + notification providers (minimum 3 required; up to 9 optional by provider choice):**

| # | Secret | Source | Mapped env var in deploy-staging.yml |
|---|--------|--------|--------------------------------------|
| 1 | `STAGING_SSH_HOST` | Step 1 | `SSH_HOST` |
| 2 | `STAGING_SSH_USER` | Step 1 | `SSH_USER` |
| 3 | `STAGING_SSH_PRIVATE_KEY` | Step 1 (private half of authorized key) | `SSH_PRIVATE_KEY` |
| 4 | `STAGING_DATABASE_URL` | Step 2 | `DATABASE_URL` |
| 5 | `STAGING_JWT_SECRET` | Step 3 | `JWT_SECRET` |
| 6 | `STAGING_JWT_REFRESH_SECRET` | Step 3 | `JWT_REFRESH_SECRET` |
| 7 | `STAGING_MASTER_MFA_KEY` | Step 3 | `MASTER_MFA_KEY` |
| 8 | `STAGING_AUDIT_CHAIN_SECRET` | Step 3 | `AUDIT_CHAIN_SECRET` |
| 9 | `STAGING_REDIS_URL` | Step 3 | `REDIS_URL` |
| 10 | `STAGING_REDIS_TLS_CA_BASE64` | Redis provider, if required | `REDIS_TLS_CA_BASE64` |
| 11 | `STAGING_DB_USER` | Step 2 | `DB_USER` |
| 12 | `STAGING_DB_PASSWORD` | Step 2 | `DB_PASSWORD` |
| 13 | `STAGING_DB_NAME` | Step 2 | `DB_NAME` |
| 14 | `STAGING_CORS_ORIGINS` | Step 3 | `CORS_ALLOWED_ORIGINS` |
| 15 | `STAGING_EMAIL_PROVIDER` | Operator choice | `EMAIL_PROVIDER` — `ses` or `mailrelay` |
| 16 | `STAGING_SMS_PROVIDER` | Operator choice | `SMS_PROVIDER` — `semaphore` |
| 17–21 | `STAGING_AWS_*`, `STAGING_SES_SENDER_EMAIL` | If SES is selected | SES request-signing configuration |
| 22–27 | `STAGING_MAILRELAY_SMTP_*`, sender fields | If TLS SMTP is selected | TLS SMTP configuration |
| 28–30 | `STAGING_SEMAPHORE_*` | Semaphore provider | HTTPS SMS configuration |

For each secret:
- [ ] Settings → Environments → Staging → Add secret.
- [ ] Type the literal name (case-sensitive).
- [ ] Paste the value.

Verify with `gh secret list --env Staging` — must show at least 14 entries (11 core + 3 notification minimum).

> **Launch boundary:** Backend rejects mock providers and incomplete provider configuration. A staging acceptance run must verify actual SES/TLS-SMTP and Semaphore delivery with approved non-sensitive recipients and retain provider message IDs.

---

### Step 7 — Ensure `deploy-staging.yml` is on the default branch

- [ ] Open PR from `remediation/production-readiness-lane-2` (or merge it).
- [ ] Verify `.github/workflows/deploy-staging.yml` is on `main`.
- [ ] Confirm: `gh workflow list --all | grep -i staging` shows `Staging Deployment` as `active`.

Without this step the workflow is invisible to GHA regardless of secrets.

---

### Step 8 — Trigger staging deploy

- [ ] In repo → Actions → "Staging Deployment" → Run workflow → branch = `main` → Run.
- [ ] Wait for `docker-build` job to complete.
- [ ] Wait for `cd-deploy-staging` job to complete.
- [ ] Confirm both jobs green.

Verify via GitHub Actions logs that checksum verification, migration, backend readiness, frontend readiness, and the post-deployment flight probe all completed successfully.

---

### Step 9 — Run smoke tests (handoff doc §6.1, §6.2)

- [ ] `curl -fI https://staging-api.gemini-hms.example.com/api/v1/health` → HTTP 200.
- [ ] `curl -fI https://staging.gemini-hms.example.com/` → HTTP 200 (or 30x).
- [ ] Browser login flow at staging URL.
- [ ] Navigate to dashboard, billing, audit — all load.
- [ ] Logout → redirect to login, cookies cleared.

---

### Step 10 — Run integration verification (handoff doc §6.4)

- [ ] E2E test suite targeting staging DB.
- [ ] `verify-migration-upgrade.ts` against staging DB.
- [ ] `infrastructure-health-probe.js` (already wired into deploy-staging.sh).

---

## B. Live Provisioning Verification

Do not reuse an old audit result as evidence of the current environment. Immediately before deployment, verify and retain evidence that:

- [ ] the GitHub `Staging` Environment exists and contains every variable referenced by the current workflow;
- [ ] the workflow is active on the branch being deployed;
- [ ] the deployment host is reachable and has the expected Docker and Compose versions;
- [ ] PostgreSQL and Redis are reachable only from approved networks;
- [ ] DNS and TLS resolve to the intended staging ingress;
- [ ] the target backup has completed and a restore procedure is current;
- [ ] alert routing reaches the responsible team;
- [ ] the deployment and rollback exercises have named owners.

## C. Boundary Statement

Repository validation proves the code and manifests can be exercised locally and in CI. It does not provision or certify the live staging host, GitHub Environment, third-party provider accounts, DNS, TLS, backups, monitoring, or alert routing. Platform/DevOps must complete and retain the live evidence above.