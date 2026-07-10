# Deployment Requirements

## Supported Runtime

- Node.js 22.x for local tooling and CI.
- Docker Engine with Docker Compose v2 on deployment hosts.
- PostgreSQL 15 or newer.
- A reachable Redis service. Production and staging do not fall back to localhost.
- HTTPS termination in front of the frontend ingress.

## Required Core Secrets

All secrets must be unique per environment and supplied through the matching GitHub Environment.

| Variable | Requirement |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for the target environment. |
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL container bootstrap values. |
| `JWT_SECRET` | At least 32 characters of cryptographic randomness. |
| `MASTER_MFA_KEY` | At least 32 characters and different from `JWT_SECRET`. |
| `AUDIT_CHAIN_SECRET` | At least 32 characters and different from all token and MFA keys. |
| `REDIS_URL` | `redis://` or `rediss://` endpoint. Required in production-equivalent environments. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact origins. Wildcards are rejected. |
| `EMAIL_PROVIDER` | `ses` or `mailrelay`; mock providers are rejected. |
| `SMS_PROVIDER` | `semaphore`; mock providers are rejected. |

For private Redis certificate authorities, also set `REDIS_TLS_CA_BASE64` to the PEM CA encoded as base64. TLS verification remains enabled.

## Provider-Specific Secrets

### AWS SES

- `AWS_REGION`
- `SES_SENDER_EMAIL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` when temporary credentials are used

### TLS SMTP / Mailrelay

- `MAILRELAY_SMTP_HOST`
- `MAILRELAY_SMTP_PORT` (defaults to `465`)
- `MAILRELAY_SMTP_USER`
- `MAILRELAY_SMTP_PASS`
- `MAILRELAY_SENDER_EMAIL`
- `MAILRELAY_SENDER_NAME`

### Semaphore SMS

- `SEMAPHORE_API_KEY`
- `SEMAPHORE_API_URL` when overriding the default HTTPS endpoint
- `SEMAPHORE_SENDER_NAME` when an approved sender name is available

## Release Process

1. Run CI and security gates on the exact commit.
2. Build backend and frontend images once in GitHub Actions.
3. Archive each image, generate checksums, and attach build-provenance attestations.
4. Transfer the exact CI-built image archives and deployment manifests to the host.
5. Verify archive checksums and load the images without rebuilding source.
6. Apply Prisma migrations once through the deployment orchestrator.
7. Roll out backend, wait for PostgreSQL and Redis readiness, then roll out frontend.
8. Run the post-deployment flight probe.
9. Automatically restore the previous application images if rollout health or the flight probe fails.

Production and staging deployments are manual `workflow_dispatch` jobs protected by the corresponding GitHub Environment. The host must not run `docker compose build` for a release.

## External Proof Still Required

Repository checks do not replace live-environment verification. Before accepting a production launch, retain evidence for:

- backup and restore rehearsal, including measured RPO and RTO;
- HTTPS and certificate validation;
- real SES/SMTP/Semaphore delivery using non-sensitive test recipients;
- alert routing and incident response;
- load and failover tests at the expected traffic profile;
- independent security and privacy review where contractually required.
