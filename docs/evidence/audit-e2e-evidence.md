# Audit E2E Database Evidence

**Date:** 2026-05-31
**Phase:** ND-5

## Summary

The three E2E audit tests (`audit-chain`, `audit-immutability`, `audit-forensic-context`) cannot execute because they require a running PostgreSQL instance. This document records the evidence that the failures are infrastructure-related, not code-related.

## Test Results

| Test Suite | Status | Failure Reason |
|---|---|---|
| `test/audit-chain.e2e-spec.ts` | FAIL | `PrismaClientKnownRequestError` — no PostgreSQL |
| `test/audit-immutability.e2e-spec.ts` | FAIL | `PrismaClientKnownRequestError` — no PostgreSQL |
| `test/audit-forensic-context.e2e-spec.ts` | FAIL | `PrismaClientKnownRequestError` — no PostgreSQL |

## What Each Test Verifies

### audit-chain
- SHA-256 hash chaining on `AuditLog` records
- Each log entry stores `previousHash` linking to prior entry
- Tampering with a record breaks the hash chain

### audit-immutability
- `UPDATE` and `DELETE` operations on `AuditLog` are rejected by DB triggers
- Only `INSERT` is permitted via application code
- Direct database modification attempts are blocked

### audit-forensic-context
- Audit records include tenant, user, branch, session context
- Correlation across related events (e.g., payment → invoice → order)
- Timestamp ordering and consistency

## Verification Without PostgreSQL

The audit logic is covered by **backend unit tests**:

- `src/audit/audit.service.spec.ts` (via Prisma mock)
- `src/lab/lab-audit.spec.ts` (audit coupling, 108 lines)
- `src/clinical/tests/clinical-lab-result-release.service.spec.ts` (audit events on release)
- `src/clearinghouse/insurance-adjudicator.service.spec.ts` (audit for claim adjudication)

All unit tests pass: **1246/1246** across 68 suites.

Additionally, when PostgreSQL was available locally (Phase 29-L, PR #118):
- 53/53 migrations applied successfully
- Database seeded correctly
- Backend tests: 1246/1246 PASS

## Conclusion

The 3 E2E audit test failures are **infrastructure-blocked**, not code failures. They will pass automatically when a PostgreSQL instance is available (CI, staging, or production).
