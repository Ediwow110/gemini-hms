# Deployment Runbook - HMS Backend

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development/migration)
- PostgreSQL 15+

## Environment Variables (Required)
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HS256 secret (min 32 chars) |
| `NODE_ENV` | Set to `production` |

## Deployment Steps
1. **Build Production Image**:
   ```bash
   docker compose -f docker-compose.prod.yml build
   ```
2. **Apply Migrations**:
   ```bash
   docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
   ```
3. **Start Stack**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

## Health Checks
- Verify `/api/v1/admin/health` returns `200 OK` with `appStatus: "ok"`.

## Rollback Procedure
1. **Application Rollback**:
   Revert to previous image tag:
   ```bash
   # Update docker-compose.prod.yml with previous version
   docker compose -f docker-compose.prod.yml up -d
   ```
2. **Database Rollback**:
   If a migration needs to be undone (use with caution):
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Monitoring
- Logs are output to `stdout` in structured format (standard NestJS logger + HTTP request logs).
- Critical errors are logged with `ERROR` level.
