# NG-1: Non-GCP Environment Variable and Secret Inventory

**Date**: 2026-06-02  
**Executor**: opencode (following exact NG-1 prompt)  
**Repo**: https://github.com/Ediwow110/gemini-hms  
**Branch**: runtime/ng1-env-secret-inventory  
**Base (post NG-0)**: 0a80ee8 "docs: select non-GCP runtime proof platform"  
**Current honest project verdict**: STAGING-ONLY  
**GCP status**: Parked (Phase 18-J IAM blocker)

---

## 1. Executive Summary

This NG-1 phase produces the exact environment-variable and secret inventory for the NG-0 selected non-GCP staging-equivalent runtime proof path:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

All work is **documentation only**. No secrets are generated or committed. No `.env` files are committed. No deployment, database creation, or migrations are performed. No real PHI is used. No production-readiness, HIPAA, or SOC 2 claims are made.

The inventory is derived from direct inspection of the current codebase (post all Phase 0–20 + Sprint 2A + S1–S21 hardening) plus the NG-0 decision document.

## 2. Current Verdict

**STAGING-ONLY / NON-GCP ENV INVENTORY COMPLETE**

All required variables for the selected topology have been identified, classified (required vs optional, secret vs non-secret), and mapped to their target platforms with exact placement rules, generation guidance, and validation criteria.

## 3. Selected Topology from NG-0

- **Frontend**: Vercel (static hosting, build-time env only)
- **Backend**: Render (Docker or buildpack, full runtime secrets)
- **Database**: Neon PostgreSQL (managed, branchable, Prisma-native)

## 4. Backend Environment Variables

| Variable                  | Platform | Required? | Secret? | Source / Notes                                                                 | Example shape only (never real value)                  | Validation / notes |
|---------------------------|----------|-----------|---------|--------------------------------------------------------------------------------|--------------------------------------------------------|--------------------|
| DATABASE_URL              | Render   | Yes       | Yes     | Neon connection string (postgresql://...)                                      | postgresql://user:pass@host:5432/db?sslmode=require   | Prisma + raw Pool usage; required by docker-compose.prod.yml and many scripts; fail-fast in several places |
| JWT_SECRET                | Render   | Yes       | Yes     | High-entropy token signing key (min 32 chars, recommended 64+)                 | a1b2c3d4e5f6... (64+ hex or urlsafe)                  | Used in auth.module, jwt.strategy, audit, storage, patient-portal. Fail-closed with clear error if missing. |
| JWT_REFRESH_SECRET        | Render   | No*       | Yes     | Planned/legacy per deployment docs — not actively read in current source       | (same as above)                                        | Documented in deployment-requirements.md and rotation playbooks but not present in current NestJS ConfigService lookups. Include for future-proofing. |
| MASTER_MFA_KEY            | Render   | Yes       | Yes     | 32+ char key for speakeasy TOTP encryption                                     | 32+ random chars (hex recommended)                     | mfa.service.ts: min 32 chars, required or throws. Used for MFA on sensitive roles. |
| CORS_ALLOWED_ORIGINS      | Render   | Yes       | No**    | Comma-separated exact frontend origin(s)                                       | https://your-app.vercel.app                           | main.ts: in production mode, missing value causes process.exit(1) ("Failing closed"). No wildcards allowed. |
| NODE_ENV                  | Render   | Yes       | No      | "production" on Render                                                         | production                                             | Controls logging level, CORS strictness, demo guards. |
| PORT                      | Render   | No        | No      | Render usually injects $PORT; fallback 3000 in main.ts                         | 3000                                                   | Dockerfile exposes 3000; healthchecks assume it. |
| DISABLE_AUTH_VERIFICATION | Render   | No        | No      | Dev-only MFA bypass ("true" to skip)                                           | false (default)                                        | Present in auth.service.ts and tests only. Must never be "true" in staging/production. |

**Notes**:
- No SMTP, AWS SES, payment, storage provider, or patient-portal-specific secrets are required or present in current .env.example or active code paths.
- Backend uses @nestjs/config + dotenv. All critical secrets are accessed via ConfigService.get() with explicit validation.

## 5. Frontend Environment Variables

| Variable       | Platform | Required? | Secret? | Notes |
|----------------|----------|-----------|---------|-------|
| VITE_API_URL   | Vercel   | Yes       | No      | Build-time only. Must point to the Render backend **including the `/api` prefix**. |

**Critical Vite / apiClient details** (from `hms-frontend/src/lib/api.ts`):
- `baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api')`
- Service layer calls are written as `/v1/...` (e.g. `/v1/auth/login`).
- Therefore the correct value for split hosting is:
  `VITE_API_URL=https://<your-render-service>.onrender.com/api`
- Resulting full URL: `https://<render>/api/v1/auth/login`
- **Warning**: Setting `VITE_API_URL=https://<render>/api/api` or using service paths that start with `/api/v1` will produce double `/api/api` and break the app.
- Vercel preview deployments have unique URLs; set the exact production URL for the proof or accept that preview deploys will need manual override.

No other `VITE_*` variables are currently required.

## 6. Database Connection Variables

- Provided entirely by Neon.
- Single variable: `DATABASE_URL` (full PostgreSQL connection string with credentials).
- SSL mode is required for Neon (`?sslmode=require` or equivalent).
- Prisma schema uses `provider = "postgresql"`.
- All migrations and seeds run against this URL via `npx prisma migrate deploy` and seed scripts.
- Use a dedicated **staging branch/database** in Neon. Never point at a production Neon project during proof.

## 7. Secret Generation Commands (do not run during this phase)

Generate fresh high-entropy secrets locally when you are ready for NG-2/NG-3. Never paste output into docs or commits.

**Node.js (recommended)**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**PowerShell**:
```powershell
[Convert]::ToHexString((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

**OpenSSL**:
```bash
openssl rand -hex 64
```

Generate three separate values:
- JWT_SECRET
- JWT_REFRESH_SECRET (if used later)
- MASTER_MFA_KEY (can be shorter, but >=32 chars)

Store **only** in the Render "Environment" variables UI (mark as secret where the platform supports it).

## 8. Platform Placement Map

**Render (backend service)** — all of the following as environment variables:
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET (if applicable)
- MASTER_MFA_KEY
- CORS_ALLOWED_ORIGINS
- NODE_ENV=production
- PORT (optional — Render provides it)

**Vercel (frontend project)**:
- VITE_API_URL (set under Project Settings → Environment Variables → Production; build-time only)

**Neon**:
- PostgreSQL database + branch
- Connection string exported as DATABASE_URL for Render

**GitHub**:
- No runtime secrets added in NG-1.
- Deployment secrets (if any) are deferred to NG-3+.

**Never commit**:
- Any value containing real credentials, keys, or tokens.
- `.env`, `.env.*`, or any file that ends up in the working tree with secrets.

## 9. CORS Plan

- CORS_ALLOWED_ORIGINS on Render must contain the **exact** Vercel production origin (e.g. `https://gemini-hms.vercel.app`).
- Multiple origins can be comma-separated for preview + production if needed.
- No wildcards (`*`) in production.
- Vercel preview deployments generate unique subdomains on every push — either pin the production URL only for the proof or temporarily add the specific preview URL.
- Backend (main.ts) already enforces this strictly in `NODE_ENV=production` mode.

## 10. API URL Plan

- VITE_API_URL (Vercel) = `https://<render-backend>.onrender.com/api`
- All frontend service calls use relative paths starting with `/v1/...`
- Final effective URL example:
  `https://gemini-hms-backend.onrender.com/api/v1/auth/login`
- Explicitly avoid the double-/api trap documented above.

## 11. Migration / Seed Env Plan

- `npx prisma migrate deploy` (and any seed commands) require a valid `DATABASE_URL` pointing at the Neon staging database.
- The backend Dockerfile already runs `npx prisma migrate deploy && node dist/src/main` as its CMD.
- For NG-2 proof: run migrations **manually** from a local machine against the Neon URL **before** the first Render deployment (safer, observable, matches existing optimization guidance).
- Use only synthetic/demo seed data. No real PHI.
- Never run `prisma migrate reset` or destructive commands against the staging Neon instance.

## 12. Security Constraints

- All secrets must be high-entropy and generated with the commands above.
- JWT_SECRET and MASTER_MFA_KEY must meet documented minimum lengths.
- CORS must be an allowlist of exact origins — no wildcards on Render.
- DISABLE_AUTH_VERIFICATION must be absent or explicitly "false" on any non-local environment.
- No secrets in Git history, GitHub, or any committed file.
- Render and Vercel secret storage is the only approved location for this proof track.

## 13. Validation Checklist

- [ ] DATABASE_URL points to a Neon staging database/branch (never production, never localhost in deployed env)
- [ ] JWT_SECRET generated with 64+ bytes entropy, stored only in Render
- [ ] MASTER_MFA_KEY generated (≥32 chars), stored only in Render
- [ ] CORS_ALLOWED_ORIGINS set to exact Vercel production URL(s) only
- [ ] NODE_ENV=production on Render
- [ ] VITE_API_URL on Vercel includes the Render backend `/api` suffix (no double /api)
- [ ] No localhost or 127.0.0.1 values present in any deployed environment variables
- [ ] No wildcard CORS entries
- [ ] No real PHI or production data used in any seed/migration during proof
- [ ] No `.env*` files committed or present in the final PR diff
- [ ] No production-readiness, HIPAA, or SOC 2 language anywhere in docs or code for this phase

## 14. Known Risks / Unknowns

- JWT_REFRESH_SECRET is referenced in older deployment docs but not actively consumed in the current NestJS codebase. Future refresh-token implementation may require it.
- Vercel preview URL churn will require either production-URL pinning or manual preview URL management during early proof deploys.
- Render free tier has sleep/cold-start behavior; this is acceptable for staging-equivalent proof but not for always-on expectations.
- Any future addition of email/SMS/payment providers will add new secret variables not covered in this inventory.

## 15. Next Phase

**NG-2 — Hosted PostgreSQL migration and seed proof**

- Create Neon staging database/branch
- Run `npx prisma migrate deploy` against it from local machine
- Run safe demo seed (no real PHI)
- Verify schema + data via Prisma Studio or direct queries
- Document exact connection string shape, migration output, and rollback steps
- Still no deployment, no secrets in repo, no production claims

---

**Verification performed for this document**:
- All critical env references traced via code search
- Existing .env.example and deployment-requirements.md cross-checked
- apiClient baseURL contract confirmed in `hms-frontend/src/lib/api.ts`
- Production fail-closed logic confirmed in `hms-backend/src/main.ts`
- No branding violations (HIPAA / SOC 2 / production-ready language) introduced
- git diff --check clean (docs only)
- Scope strictly limited to documentation

**Verdict**: STAGING-ONLY / NON-GCP ENV INVENTORY COMPLETE
