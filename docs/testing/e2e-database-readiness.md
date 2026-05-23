# E2E Database Readiness Audit

**Status:** BLOCKED (Infrastructure Offline)

## Current Blocker
Database-backed E2E tests are currently failing because the required PostgreSQL test instance is unavailable in the execution environment.

- **Error Log:** `Can't reach database server at postgres_prod`
- **Root Cause:** The `postgres_prod` host is expected by the Prisma client during E2E test initialization but is not reachable. This typically requires a running Docker Compose environment or a local PostgreSQL service configured with the correct credentials.

## Required Services
To run true E2E tests for the Integration Bridges, the following services must be online:
1. **PostgreSQL:** A dedicated test database instance.
2. **Prisma Migrate:** The database schema must be applied to the test instance before runs.

## Required Environment Variables
E2E tests typically require a `.env.test` or similar override:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/hms_test"
NODE_ENV="test"
JWT_SECRET="test-secret-key-for-e2e-tests-that-is-long-enough"
```

## Data Seeding & Cleanup
- **Seeding:** Tests should use a global setup or per-test setup to seed necessary Tenant, User, and Patient records. Use `npx prisma migrate reset --force` or custom scripts.
- **Cleanup:** Every E2E test must include a `afterAll` or `afterEach` hook to truncate tables and prevent cross-test contamination.
- **Command:** `npm run test:e2e`

## Verification Command
Once infrastructure is available, run:
```bash
cd hms-backend
npm run test:e2e
```

## Current Coverage Strategy
Until true DB E2E infrastructure is available, all security boundaries are proved via **Seeded Service-Level Tests** (`npm test src/integration/tests/`).
- These tests use mocked Prisma responses to simulate database records.
- They prove that the service-layer logic correctly filters, redacts, and gates data based on the authenticated user context.
- They provide 100% coverage of the `IntegrationScopePolicy` rules.

## True DB E2E Value-Add
Implementing true DB E2E will add verification for:
1. Complex Prisma relational filters (e.g., deeply nested `where` clauses).
2. Database-level constraints and triggers (e.g., preventing hard deletes of audit logs).
3. Actual SQL execution performance for aggregated timelines.
4. Transactional integrity across multiple domain models.
