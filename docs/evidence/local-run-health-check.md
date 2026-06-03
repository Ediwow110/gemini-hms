# LOCAL-RUN HEALTH CHECK — Broken Files / Local Startup Audit

**Date:** 2026-06-03
**Branch:** `local/local-run-health-check`
**Base:** `main` (`bc582e2`)

## Scope

- Local development startup (Windows, PowerShell 7)
- Backend setup (NestJS + Prisma + PostgreSQL)
- Frontend setup (Vite + React)
- Environment variable examples and documentation accuracy

## Files Inspected

- `README.md` — local setup instructions
- `hms-backend/.env.example` — backend env template
- `hms-frontend/.env.example` — (newly created)
- `setup.ps1` — Windows setup script
- `setup-windows.md` — Windows setup guide
- `docs/runbooks/environment-checklist.md` — environment reference
- `hms-backend/src/main.ts` — backend bootstrap (PORT, CORS, NODE_ENV)
- `hms-backend/src/auth/mfa.service.ts` — MASTER_MFA_KEY usage
- `hms-backend/src/auth/jwt.strategy.ts` — JWT_SECRET usage
- `hms-backend/src/prisma/prisma.service.ts` — DATABASE_URL usage
- `hms-frontend/src/lib/api.ts` — VITE_API_URL / API fallback
- `hms-frontend/vite.config.ts` — dev proxy config
- `docker-compose.yml` — PostgreSQL service definition

## Commands Run and Results

| Command | Result |
|---------|--------|
| Backend `npm install --include=dev` | ✅ (pre-installed) |
| `npx prisma generate` | ✅ Generated Prisma Client v7.8.0 |
| `npx prisma validate` | ✅ Schema valid |
| Backend `npm run lint` | ✅ 0 errors, 447 warnings (pre-existing) |
| Backend `npx tsc -p tsconfig.build.json --noEmit` | ✅ 0 errors |
| Backend `npm test` | ✅ 1435/1435 passed (75 suites) |
| Backend `npm run build` | ✅ (nest build) |
| Frontend `npm install` | ✅ (pre-installed) |
| Frontend `npm run lint` | ✅ 0 errors, 0 warnings |
| Frontend `npx tsc --noEmit` | ✅ 0 errors |
| Frontend `npm test` | ✅ 181/181 passed (19 files) |
| Frontend `npm run build` | ✅ (built in 2.49s) |
| `prisma db push` | ✅ Database synced (PostgreSQL via Docker) |
| `prisma db seed` | ✅ Seed completed (demo data) |
| Backend `npm run start:dev` | ✅ Running — `GET /` = 200, `POST /api/v1/auth/login` = 400 |
| Frontend `npm run dev` | ✅ Running — `GET /` = 200 |

## Confirmed Blockers

| ID | Severity | Area | Description | Status |
|----|----------|------|-------------|--------|
| — | — | — | No code blockers found | — |

## Local-Only Setup Issues

| Issue | Note |
|-------|------|
| Missing local PostgreSQL | Requires Docker or local install. `docker compose up -d db` resolves this |
| Missing `.env` file | Must be created from `.env.example`; `setup.ps1` does not create it |
| Missing `MASTER_MFA_KEY` | Was missing from `.env.example` — fixed in this PR |
| Missing `CORS_ALLOWED_ORIGINS` | Was missing from `.env.example` — fixed in this PR |
| Missing `PORT`, `NODE_ENV` | Was missing from `.env.example` — fixed in this PR |
| Node/npm version | No issues detected with current Node.js |

## Code Issues

None found. Both typecheck and build pass cleanly.

## Documentation Issues

| Issue | Status |
|-------|--------|
| `hms-backend/.env.example` missing MASTER_MFA_KEY, CORS_ALLOWED_ORIGINS, PORT, NODE_ENV | ✅ Fixed |
| `README.md` used `cp` (Linux command) for Windows setup | ✅ Fixed — uses `Copy-Item` |
| `README.md` didn't mention Docker PostgreSQL option | ✅ Added |
| `setup.ps1` final message misleadingly claimed "Setup Complete" without .env/DB | ✅ Fixed |
| `setup-windows.md` didn't include .env creation or database steps | ✅ Fixed |
| `hms-frontend/.env.example` did not exist | ✅ Added (optional, VITE_API_URL) |

## Fixes Applied

1. **`hms-backend/.env.example`** — Added `MASTER_MFA_KEY`, `CORS_ALLOWED_ORIGINS`, `PORT`, `NODE_ENV` with example values
2. **`README.md`** — Updated local setup section with PowerShell commands (`Copy-Item`), Docker PostgreSQL option, explicit note that root package.json does not exist
3. **`setup.ps1`** — Updated final output to clarify .env creation, DB startup, migration, and seed are still required
4. **`setup-windows.md`** — Added .env creation, PostgreSQL startup, `prisma db push`, and `prisma db seed` steps
5. **`hms-frontend/.env.example`** — Created with `VITE_API_URL` documentation

## Deferred Items

- Backend lint warnings (447 pre-existing, all warnings, no errors) — not a local-run blocker
- Audit test failures (pre-existing) — not related to local-run
- E2E tests require running PostgreSQL — documented in setup

## Final Verdict

**LOCAL-RUN READY AFTER ENV SETUP**
