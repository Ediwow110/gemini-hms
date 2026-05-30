## Summary

<!-- What changed and why? -->

## Change Type

- [ ] Feature
- [ ] Bug fix
- [ ] Security hardening
- [ ] Production readiness
- [ ] Documentation only
- [ ] Refactor / cleanup

## Risk Classification

- [ ] P0 / Critical production safety
- [ ] P1 / High risk
- [ ] P2 / Medium risk
- [ ] P3 / Low risk

## Required Verification

- [ ] Backend lint passed
- [ ] Backend build passed
- [ ] Backend unit tests passed
- [ ] Backend E2E tests passed, if API/auth/data behavior changed
- [ ] Frontend typecheck passed, if frontend changed
- [ ] Frontend lint passed, if frontend changed
- [ ] Frontend tests passed, if frontend changed
- [ ] Frontend production build passed, if frontend changed
- [ ] Docker build passed, if runtime/dependency changes were made
- [ ] Production-equivalent smoke test passed, if deployment/runtime behavior changed

## Security and Privacy Checklist

- [ ] No private runtime values committed
- [ ] No unsupported HIPAA, SOC 2, certification, or production-ready claims added
- [ ] Auth, RBAC, tenant isolation, or branch isolation impact reviewed
- [ ] PHI/ePHI exposure risk reviewed
- [ ] CSRF, CORS, and session behavior reviewed, if auth behavior changed
- [ ] Rate limiting impact reviewed, if public endpoints changed
- [ ] Dependency audit reviewed, if dependencies changed

## Database / Migration Checklist

- [ ] No database changes
- [ ] Prisma schema changed and migration included
- [ ] Migration applies cleanly from an empty database
- [ ] Migration applies cleanly to an existing seeded database
- [ ] Destructive migration reviewed and backup/rollback plan documented

## Deployment / Operations Checklist

- [ ] Environment variables documented
- [ ] Healthcheck behavior reviewed
- [ ] Logging/metrics impact reviewed
- [ ] Rollback path documented
- [ ] Backup/restore impact reviewed, if data shape changed

## Evidence

Paste command outputs, CI run links, screenshots, or evidence document links here.

```text
npm run test
npm run test:e2e
npm run build
docker compose -f docker-compose.prod.yml config
```

## Known Risks / Deferred Work

<!-- Be explicit. Hidden risk is worse than bad news. -->

## Final Reviewer Verdict

- [ ] NO-GO
- [ ] STAGING-ONLY
- [ ] PILOT-READY
- [ ] PRODUCTION-READY
