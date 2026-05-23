# Deployment Requirements Checklist

## Minimum Staging Infrastructure
- **Cloud Provider**: GCP (current target) or AWS.
- **Virtual Machine**: 1x e2-medium (2 vCPU, 4GB RAM) for Docker runtime.
- **Database**: Cloud SQL (PostgreSQL 15+) with at least 10GB storage.
- **Secrets**: Secure storage for 10+ environment variables.

## Required Environment Variables
- `DATABASE_URL`: Connection string for PostgreSQL.
- `JWT_SECRET`: High-entropy key for staff tokens.
- `JWT_REFRESH_SECRET`: High-entropy key for session refresh.
- `MASTER_MFA_KEY`: 32-character key for MFA encryption.
- `AUDIT_HMAC_SECRET`: Key for audit log signing.
- `CORS_ALLOWED_ORIGINS`: Restricted list of frontend URLs.

## Deployment Process
1. **Infrastructure Provisioning**: Create VPC, VM, and Cloud SQL.
2. **Secret Configuration**: Inject keys into GitHub Actions Secrets.
3. **Migration Apply**: Run `npx prisma migrate deploy` against the target database.
4. **CI/CD Push**: Push to `main` branch to trigger the production-build workflow.
5. **Remote Orchestration**: Execute `remote-deploy.sh` to pull images and restart containers.

## Cost & Budget Note
- **Free/Local Demo**: Costs $0; runs on local developer hardware.
- **Paid Staging**: Requires client cloud account or direct funding for monthly GCP costs (~$50-$150/mo depending on database instance size).
- **Deployment Proof**: Real-world validation (Load Testing, HTTPS termination) is only possible on a paid environment.

## Responsibilities
| Task | Responsible Party |
| :--- | :--- |
| **Code Integrity** | Vendor (Gemini-HMS Team) |
| **Cloud Billing** | Client |
| **Infrastructure IAM** | Client / Owner |
| **Initial Deployment** | Vendor (with Client Access) |
| **Security Certification**| External Auditor (3rd Party) |
