# Environment Checklist

## Environment Separation

| Environment | Data | External access | Required controls |
|---|---|---|---|
| Local | Synthetic | None | Local-only secrets; mock notifications allowed. |
| Production-equivalent local | Synthetic | None | `NODE_ENV=production`; real Redis; non-mock notifications. |
| Staging | Synthetic or formally sanitised | Restricted team access | Dedicated GitHub Environment, secrets, backups, monitoring. |
| Production | Real | Authorised users | Dedicated GitHub Environment, change approval, backups, monitoring, incident response. |

Never reuse production secrets, databases, Redis instances, notification credentials, or storage buckets in staging.

## Core Runtime Variables

| Variable | Required in production/staging | Notes |
|---|---:|---|
| `NODE_ENV` | Yes | Must be `production`. |
| `DATABASE_URL` | Yes | Target PostgreSQL connection string. |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Yes | Database container bootstrap values. |
| `JWT_SECRET` | Yes | Minimum 32 characters. |
| `MASTER_MFA_KEY` | Yes | Minimum 32 characters; must differ from JWT secret. |
| `AUDIT_CHAIN_SECRET` | Yes | Minimum 32 characters; dedicated audit HMAC key. |
| `REDIS_URL` | Yes | Must use `redis://` or `rediss://`. |
| `REDIS_TLS_CA_BASE64` | Conditional | Private CA PEM encoded as base64. Certificate verification stays enabled. |
| `CORS_ALLOWED_ORIGINS` | Yes | Exact origins only; no wildcard or path. |
| `EMAIL_PROVIDER` | Yes | `ses` or `mailrelay`. |
| `SMS_PROVIDER` | Yes | `semaphore`. |
| `SENTRY_DSN` | Recommended | Error reporting for the target environment. |

`DISABLE_AUTH_VERIFICATION=true`, mock notification providers, missing Redis, and wildcard CORS are rejected at production startup.

## Notification Variables

### SES

- `AWS_REGION`
- `SES_SENDER_EMAIL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` when applicable

### TLS SMTP

- `MAILRELAY_SMTP_HOST`
- `MAILRELAY_SMTP_PORT`
- `MAILRELAY_SMTP_USER`
- `MAILRELAY_SMTP_PASS`
- `MAILRELAY_SENDER_EMAIL`
- `MAILRELAY_SENDER_NAME`

### Semaphore

- `SEMAPHORE_API_KEY`
- `SEMAPHORE_API_URL` when overriding the default endpoint; HTTPS is mandatory
- `SEMAPHORE_SENDER_NAME` when configured by the provider

## Secret Handling

- Store deployment secrets in GitHub Environments or an approved secrets manager.
- Do not commit `.env` files containing real credentials.
- Do not pass raw secrets in SSH command text. Deployment workflows transfer base64-encoded values in a mode-600 temporary file and delete it after import.
- Rotate immediately after suspected exposure and use separate values for every environment.
- Treat audit, MFA, JWT, database, Redis, email, and SMS credentials as separate security domains.

## Pre-Deployment Validation

- [ ] CI static analysis, backend tests, frontend tests, browser smoke, and Docker build are green for the exact commit.
- [ ] Security gates are green: dependency audit, secret scan, CodeQL, container scan, and SBOM generation.
- [ ] The target workflow uses the expected GitHub Environment (`Staging` or `Production`).
- [ ] Backend and frontend image archives have valid SHA-256 checksums and build-provenance attestations.
- [ ] No source build occurs on the deployment host.
- [ ] All core and provider-specific variables are present.
- [ ] `JWT_SECRET`, `MASTER_MFA_KEY`, and `AUDIT_CHAIN_SECRET` are distinct and at least 32 characters.
- [ ] Redis is reachable and TLS validation succeeds where `rediss://` is used.
- [ ] PostgreSQL is reachable and the target database is correct.
- [ ] The migration backup/rollback decision has been recorded.
- [ ] `/api/v1/health` reports `UP` only after both PostgreSQL and Redis are ready.
- [ ] Real notification delivery has been tested with approved non-sensitive recipients in the target environment.
- [ ] Backup restore, alert routing, and post-deployment rollback procedures have current evidence.

## Public Claims Hygiene

Before release, search for unsupported certification or readiness claims:

```bash
git grep -n "HIPAA Compliant\|SOC2 Certified\|SOC 2 Certified\|Enterprise Ready\|Built for Production\|Production Ready" -- docs/ hms-frontend/ hms-backend/
```

A passing codebase does not by itself establish regulatory certification or production operating maturity.
