# Demo Dry-Run Issue Log

| ID | Severity | Area | Description | Impact | Fix/Fallback | Status |
|----|----------|------|-------------|--------|--------------|--------|
| 001 | BLOCKING | Backend | `NODE_ENV=production` causes crash due to missing `CORS_ALLOWED_ORIGINS` even in dev mode. | Backend fails to start. | Explicitly set `NODE_ENV=development` in start script or environment. | RESOLVED |
| 002 | REQUIRED | Database | Existing patients from E2E tests missing `[DEMO]` prefix. | Violates no-PHI preflight rules. | Run `scripts/fix-demo-data.ts` to prefix all patients. | RESOLVED |
| 003 | REQUIRED | Documentation | `npm run db:reset:demo` referenced in preflight but missing from `package.json`. | Operator cannot quickly reset if PHI found. | Create `scripts/reset-demo-db.ts` and add to `package.json`. | RESOLVED |
| 004 | NON-BLOCKING | UI | Prisma Studio default port 5555 might conflict if already running. | Operator cannot inspect DB. | Use specific port (e.g., 5556) or check before starting. | RESOLVED |
| 005 | NON-BLOCKING | UI | Background processes might hang on exit. | Port 3000/5173 remains occupied. | Use `taskkill` or manual cleanup script. | RESOLVED |
