# SOC2 Type II Trust Services Criteria Matrix

This document maps HMS engineering implementations and operational controls directly to the **AICPA SOC2 Trust Services Criteria** (Security, Confidentiality, and Availability).

---

## 1. Trust Services Category: Security (Logical Access Control)
*   **SOC2 Criteria**: CC6.1, CC6.2, CC6.3 (Access management, credential lifecycle, role permissions).
*   **HMS Platform Control**:
    *   *Quarterly Access Reviews*: `AccessReviewService.generateAccessReviewReport` lists every active account, assigned roles, and current session activities.
    *   *Stale Account Sweep*: `AccessReviewService.detectStaleAccounts` scans for accounts inactive for more than 90 days, enabling automatic locking.
    *   *Privilege Escalation Detection*: `AccessReviewService.detectPrivilegeEscalation` sweeps audit records for accounts modifying user role permissions or exercising unassigned scopes.
    *   *Maker-Checker Controls*: Enforced governance workflows requiring secondary approval for high-risk role changes.

## 2. Trust Services Category: Security (Change Management)
*   **SOC2 Criteria**: CC8.1 (System development, testing, release, and migration authorization).
*   **HMS Platform Control**:
    *   *Prisma Migration Audits*: `ChangeManagementService.getSchemaChangeHistory` queries PostgreSQL migration tables to identify direct DB schema adjustments.
    *   *Deployment History Logs*: `ChangeManagementService.getDeploymentHistory` compiles container build tags, environment adjustments, and release windows.
    *   *CI/CD Verification Gates*: Dynamic npm audits, schema validation tests, and 80%+ E2E coverage locks.

## 3. Trust Services Category: Availability (Redundancy & Active-Active Replication)
*   **SOC2 Criteria**: CC7.1, CC7.2 (Vulnerability management, incident response, multi-region failover).
*   **HMS Platform Control**:
    *   *Active-Active Conflict Resolution*: `ConflictResolverService.resolveConflict` utilizes last-write-wins (LWW) to deterministically converge divergent replicas.
    *   *Active Conflict Detection*: `ConflictResolverService.detectConflicts` scans cross-region writes in real-time.
    *   *Continuous Health Monitoring*: `RegionHealthService` checks latency, ping rates, and connectivity across regions every 30s.

## 4. Trust Services Category: Confidentiality (Data Isolation)
*   **SOC2 Criteria**: CC6.5 (Boundary defense, row-level multi-tenant isolation).
*   **HMS Platform Control**:
    *   *Multi-Tenant Guards*: Global header verification with cross-tenant blocking, ensuring tenant queries are restricted exclusively to their respective context.
