# Staging Environment Provisioning Checklist (Execution-Ready)

**Status as of audit:** Staging environment NOT PROVISIONED — all 7 required elements absent.
**Authority:** `docs/infrastructure/staging-provisioning-handoff.md` (Sections 3–6).
**Aligned to:** `.github/workflows/deploy-staging.yml` (committed in `72bd168`).

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
- `curl -fI https://staging-api.gemini-hms.example.com/health` returns `HTTP/2 200` after deploy (post-step 8).

---

### Step 5 — Create GitHub `Staging` environment

- [ ] In repo https://github.com/Ediwow110/gemini-hms/settings/environments, click **New environment**.
- [ ] Name: `Staging` (exact case).
- [ ] Protection rules: **None required** for automated deploys.
- [ ] Deployment branches: allow `main` (and optionally `remediation/production-readiness-lane-2` for the next deploy).
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
| 8 | `STAGING_DB_USER` | Step 2 | `DB_USER` |
| 9 | `STAGING_DB_PASSWORD` | Step 2 | `DB_PASSWORD` |
| 10 | `STAGING_DB_NAME` | Step 2 | `DB_NAME` |
| 11 | `STAGING_CORS_ORIGINS` | Step 3 | `CORS_ALLOWED_ORIGINS` |
| 12 | `STAGING_EMAIL_PROVIDER` | Operator choice | `EMAIL_PROVIDER` — must be `ses` or `mailrelay` (mock forbidden) |
| 13 | `STAGING_SMS_PROVIDER` | Operator choice | `SMS_PROVIDER` — must be `semaphore` (mock forbidden) |
| 14 | `STAGING_AWS_REGION` | If `EMAIL_PROVIDER=ses` | `AWS_REGION` |
| 15 | `STAGING_SES_SENDER_EMAIL` | If `EMAIL_PROVIDER=ses` | `SES_SENDER_EMAIL` |
| 16 | `STAGING_SEMAPHORE_API_KEY` | If `SMS_PROVIDER=semaphore` | `SEMAPHORE_API_KEY` |
| 17–20 | `STAGING_MAILRELAY_*` | If `EMAIL_PROVIDER=mailrelay` | `MAILRELAY_API_KEY`, `MAILRELAY_SMTP_PASS`, `MAILRELAY_SENDER_EMAIL`, `MAILRELAY_SENDER_NAME` |

For each secret:
- [ ] Settings → Environments → Staging → Add secret.
- [ ] Type the literal name (case-sensitive).
- [ ] Paste the value.

Verify with `gh secret list --env Staging` — must show at least 14 entries (11 core + 3 notification minimum).

> **Launch boundary:** Backend starts only with non-mock `EMAIL_PROVIDER`/`SMS_PROVIDER`. Actual send delivery is not implemented yet (`notification-providers.ts:103-108`, `138-143`) — notifications will fail honestly at dispatch, not fake SENT.

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

Verify via GHA logs: search for `🎉 STAGING DEPLOYMENT SWEEP SUCCESSFUL (EXIT 0)`.

---

### Step 9 — Run smoke tests (handoff doc §6.1, §6.2)

- [ ] `curl -fI https://staging-api.gemini-hms.example.com/health` → HTTP 200.
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

## B. What this audit confirmed is NOT yet present

| Item | Status | Evidence |
|------|--------|----------|
| GitHub `Staging` environment | ❌ Absent | `gh api repos/Ediwow110/gemini-hms/environments` → only Preview, Production |
| Any `STAGING_*` secret | ❌ Absent | `gh secret list --env Staging` → HTTP 404; repo-level has 8 secrets, none `STAGING_*` |
| `deploy-staging.yml` on `main` | ❌ Absent | `gh workflow list` shows 5 workflows, no staging; file is on local remediation branch only |
| Staging VM reachable | ❌ Absent | `Test-NetConnection` to staging hostnames → `TcpTestSucceeded=False` |
| Staging DB | ❌ Absent | Cannot test without VM; no record of provisioning |
| DNS records | ❌ Absent | `nslookup` returns NXDOMAIN-style answer (placeholder names only) |
| Health endpoint | ❌ Absent | No backend can respond without VM + DB + workflow run |

---

## C. Boundary statement

This audit was performed from a Windows dev workstation with `gh` CLI authenticated
to the Ediwow110/gemini-hms repo. The agent has no authority or mechanism to
provision VMs, databases, DNS records, or GitHub environments from this environment.

**Until steps 1–7 are completed by Platform/DevOps, deployment to staging is impossible,
regardless of how strong the local codebase is.**