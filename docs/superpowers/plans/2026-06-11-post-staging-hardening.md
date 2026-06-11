# Phase 5: Post-Staging Product Hardening Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the protocols and automated scripts required to validate the application's integrity, performance, and security boundaries under simulated production-scale load in a live staging environment.

**Architecture:** A multi-layered validation strategy employing high-volume database fixtures, parallel Playwright test execution for concurrency stress, and systematic RBAC boundary probing against a live, cloud-hosted staging target.

**Tech Stack:** Playwright (for parallel/RBAC E2E), Node.js/Prisma (for high-volume fixtures), Shell Scripting.

---

## 1. Current Post-Staging Starting Point
- **Local Context:** Local application code is frozen. CI readiness is established (local test scripts, CI configurations). Staging deployment readiness is prepared (dry-run scripts, infrastructure requirements, initial smoke test).
- **Staging Context:** We assume the staging environment is technically deployed but its behavior under real-world pressure remains untested.
- **Unproven:** Data consistency during concurrent mutations, isolation between specialized clinical roles, query performance on large datasets.

## 2. What Must Already Be True Before This Phase Starts
- The staging environment has been successfully provisioned by DevOps/Platform teams.
- The CI/CD pipeline is actively building images and deploying them to staging.
- The `staging-smoke.spec.ts` passes against the live URL, confirming HTTPS and basic connectivity.
- A clean, dedicated staging database exists, populated only with foundational role/tenant seed data.

---

### Task 1: Prepare Multi-User Concurrency Verification Plan (Locally Preparable)

This test suite simulates "Parallel Mutation Stress" to ensure the backend's locking mechanisms (e.g., First-Writer-Wins) prevent data corruption.

**Files:**
- Create: `hms-frontend/e2e/concurrency-stress.spec.ts`

- [ ] **Step 1: Write the concurrency test script**

```typescript
// hms-frontend/e2e/concurrency-stress.spec.ts
import { test, expect } from '@playwright/test';

const baseURL = process.env.STAGING_URL;

test.describe('Concurrency Stress Tests', () => {
  test.skip(!baseURL, 'Requires live staging environment');

  test('prevents double-payment via concurrent requests', async ({ request }) => {
    // Setup: Retrieve a pending invoice ID (mocked for planning)
    const invoiceId = 'test-invoice-id';
    
    // Simulate two cashiers attempting to pay the exact same invoice at the exact same millisecond
    const [response1, response2] = await Promise.all([
      request.post(`${baseURL}/api/v1/payments`, { data: { invoiceId, amount: 100 } }),
      request.post(`${baseURL}/api/v1/payments`, { data: { invoiceId, amount: 100 } })
    ]);

    // Expect exactly one to succeed (200/201) and exactly one to fail with conflict (409)
    const statuses = [response1.status(), response2.status()].sort();
    expect(statuses[0]).toBeGreaterThanOrEqual(200);
    expect(statuses[0]).toBeLessThan(300);
    expect(statuses[1]).toBe(409); // Conflict
  });
});
```

- [ ] **Step 2: Commit changes**
```bash
git add hms-frontend/e2e/concurrency-stress.spec.ts
git commit -m "test(e2e): prepare concurrency stress test suite"
```

---

### Task 2: Prepare Role-Based Workflow Verification Plan (Locally Preparable)

This suite systematically audits the "Fail-Closed" security model to verify isolation between clinical, administrative, and financial roles.

**Files:**
- Create: `hms-frontend/e2e/rbac-boundaries.spec.ts`

- [ ] **Step 1: Write the RBAC boundary test script**

```typescript
// hms-frontend/e2e/rbac-boundaries.spec.ts
import { test, expect } from '@playwright/test';

const baseURL = process.env.STAGING_URL;

test.describe('RBAC Boundary Verification', () => {
  test.skip(!baseURL, 'Requires live staging environment');

  test('pharmacist cannot access HR payroll data', async ({ request }) => {
    // Assume request context is authenticated as a Pharmacist
    // In actual implementation, utilize Playwright's auth state features
    const response = await request.get(`${baseURL}/api/v1/hr/payroll`);
    
    // Must return 403 Forbidden (not 404 or 500)
    expect(response.status()).toBe(403);
  });
});
```

- [ ] **Step 2: Commit changes**
```bash
git add hms-frontend/e2e/rbac-boundaries.spec.ts
git commit -m "test(e2e): prepare rbac boundary verification suite"
```

---

### Task 3: Prepare High-Volume Fixture Validation Plan (Locally Preparable)

Create the tooling to inject production-scale data into the staging database to test query performance.

**Files:**
- Create: `hms-backend/scripts/generate-volume-fixtures.ts`

- [ ] **Step 1: Write the fixture generation script**

```typescript
// hms-backend/scripts/generate-volume-fixtures.ts
// This script utilizes Prisma to bulk-insert synthetic data.
// It is designed to run AGAINST STAGING, never production.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const isStaging = process.env.DATABASE_URL?.includes('staging');
  if (!isStaging) throw new Error("Safety abort: Not targeting staging database.");

  console.log("Generating high-volume patient fixtures...");
  // Implementation will use prisma.patient.createMany() in chunks
  // to insert 100k+ synthetic records.
}

main().catch(console.error);
```

- [ ] **Step 2: Commit changes**
```bash
git add hms-backend/scripts/generate-volume-fixtures.ts
git commit -m "chore(db): prepare high-volume fixture generation script"
```

---

## 6. Performance and Indexing Verification Plan (Requires Live Staging)
- **Time-to-Interactive (TTI):** Execute Playwright tests against the data-heavy views (e.g., Patient Directory, Master Worklist) loaded with the high-volume fixtures.
- **SQL Execution Analysis:** Connect to the staging database directly and run `EXPLAIN ANALYZE` on critical read queries to ensure indexes are utilized effectively.

## 7. Deferred Product Architecture Items (Wait Until This Phase)
- **Clinical Decision Support (CDS) Engine:** Complex rules engines should only be integrated once the base system's performance and concurrency handling are proven.
- **External e-Prescribing:** Integrations with external networks (NCPDP) require a stable, externally accessible staging environment to receive callbacks.

## 8. Required Evidence/Artifacts
1. **Concurrency Stress Report:** Playwright XML/HTML output demonstrating 0% data corruption under simulated concurrent load.
2. **RBAC Audit Report:** Test output confirming 100% compliance with the Role Scope Matrix.
3. **Performance Benchmark Report:** Logged Time-to-Interactive metrics and database indexing validation results.

## 9. Implementation Order
1. (Local Prep) Define Concurrency and RBAC E2E suites.
2. (Local Prep) Draft high-volume fixture generation scripts.
3. (Live Staging) Run high-volume fixture generation against the staging database.
4. (Live Staging) Execute Performance and Indexing analysis.
5. (Live Staging) Execute Concurrency and RBAC suites against the loaded environment.
6. (Live Staging) Begin implementing deferred architecture items.

## 10. Entry and Exit Criteria
- **Entry Criteria:** Phase 4 Staging Readiness is complete. Staging environment is live, accessible via HTTPS, and populated with baseline seed data.
- **Exit Criteria:** All verification reports (Concurrency, RBAC, Performance) are green and documented. The application is proven to handle production-scale load and multi-actor constraints safely.

## 11. Final Readiness Verdict
Once the local preparation scripts in this plan are committed, the project is technically prepared to conduct deep, production-grade hardening. Execution of the actual validations is entirely blocked until the live staging environment is delivered by the infrastructure team.
