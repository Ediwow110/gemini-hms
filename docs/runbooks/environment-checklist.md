# Environment Checklist

## Purpose

Provide a single-source-of-truth reference for environment configuration across all HMS deployment targets.

## Environment Separation

| Environment | Purpose | Data | External Access | Backups |
|---|---|---|---|---|
| local | Developer workstation | Synthetic | None | None |
| production-equivalent local | Local full-stack test | Synthetic | None | Optional |
| staging | Pre-release validation | Synthetic / Sanitised | Team only | Regular |
| pilot | Limited real-user validation | Real (sanitised) | Limited users | Full |
| production | Live service | Real | All authorised users | Full, encrypted |

**Note**: At this stage, only local, production-equivalent local, and staging are configured. Pilot and production require additional infrastructure not yet provisioned.

## Required Variables

| Variable | Description | Example | Secret |
|---|---|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://user:pass@localhost:5432/hms` | Yes |
| `DB_USER` | Database user | `hms_app` | Yes |
| `DB_PASSWORD` | Database password | (auto-generated) | Yes |
| `DB_NAME` | Database name | `hms_prod` | No |
| `JWT_SECRET` | Token signing secret | (256-bit random) | Yes |
| `MASTER_MFA_KEY` | MFA encryption key | (256-bit random) | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins | `http://localhost:5173` | No |
| `NODE_ENV` | Runtime mode | `production` | No |
| `FRONTEND_PORT` | Frontend dev server port | `5173` | No |

## Optional Variables

| Variable | Description | Notes |
|---|---|---|
| `PORT` | Backend server port | Defaults to `3000` |
| `LOG_LEVEL` | Logging verbosity | `debug`, `info`, `warn`, `error` |
| `SENTRY_DSN` | Error tracking | If Sentry is configured |
| `REDIS_URL` | Cache/queue backend | If Redis is configured |
| `SMTP_HOST` | Email sending | If email is configured |
| `SMTP_PORT` | Email port | If email is configured |
| `SMTP_USER` | Email user | If email is configured |
| `SMTP_PASS` | Email password | If email is configured |
| `STORAGE_BUCKET` | File storage | If object storage is configured |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms) | Defaults to `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | Defaults to `100` |

## Secret Handling Rules

- Never commit secrets to the repository
- Never log secrets
- Never share secrets via chat or email
- Use environment variables or a secrets manager (e.g., HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets quarterly, or immediately if a compromise is suspected
- Use different secrets per environment (never reuse production secrets in staging)

## Rotation Notes

- `JWT_SECRET`: Rotate immediately if any token is suspected compromised. All sessions will be invalidated.
- `DB_PASSWORD`: Rotate during maintenance windows. Requires application restart.
- `MASTER_MFA_KEY`: Rotate carefully — all MFA registrations will be invalidated. Schedule with user communication.

## Validation Checklist

Before deploying to any environment:

- [ ] `DATABASE_URL` points to the correct database
- [ ] `JWT_SECRET` is at least 32 characters of cryptographic randomness
- [ ] `MASTER_MFA_KEY` is at least 32 characters of cryptographic randomness
- [ ] `CORS_ALLOWED_ORIGINS` contains only expected origins
- [ ] `NODE_ENV` is set to `production` (not `development`)
- [ ] All secrets are unique to this environment
- [ ] Database is reachable: `psql "$DATABASE_URL" -c "SELECT 1"`
- [ ] No secrets are committed in `.env` files, source code, or documentation

## Public Claims Hygiene Check

Before every deploy, verify no unsupported public claims exist in the codebase:

```bash
git grep -n "HIPAA Compliant\|SOC2 Certified\|SOC 2 Certified\|Enterprise Ready\|Built for Production\|Production Ready" -- docs/ hms-frontend/ hms-backend/
```

Expected output: no matches.

---

**Note**: This checklist is operator readiness scaffolding. It does not imply production readiness or compliance certification.
