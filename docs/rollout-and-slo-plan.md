# First Clinic Rollout & Operational Reliability Plan

This document details the environment topology, Service Level Objectives (SLOs), monitoring mappings, incident response playbooks, and staged rollout phases for onboarding **Clinic A** (our first real small-clinic customer) onto Gemini-HMS.

---

## 1. Target Clinic Profile: Clinic A

*   **Customer Name**: Metro Health Diagnostic Center
*   **Scale & Users**:
    *   **Branches**: 2 locations (Main Branch & East Annex Branch).
    *   **Concurrent Staff**: 10–15 active staff users (2 Branch Admins, 3 Doctors, 6 Nurses/Front-desk encoders, 3 Cashiers).
    *   **Daily Load**: Up to 300 patient orders, 150 laboratory tests, and 200 cashier payments per day.
*   **Deployment Scope**: Dedicated Single-Tenant deployment (isolated virtual private cloud and dedicated database instance).
*   **In-Scope Modules**: Patients, Orders, Queueing, Laboratory, Billing (Cashier Sessions & Payments).
*   **Deferred Modules**: HR Module (pre-seeded admin accounts are rotated manually; active self-enrollment/invite features are deferred for Phase 3).

---

## 2. Environment Topology

A highly secure, simplified, and production-hardened topology designed for high availability on a single-node deployment without unnecessary cloud overhead.

```
       [ Public Internet ]
               │
               ▼ (HTTPS / Port 443)
       ┌──────────────────────────────┐
       │     NGINX Reverse Proxy      │  <-- Terminates SSL/TLS (Let's Encrypt)
       └──────────────┬───────────────┘      Injects security & CORS headers
                      │
            ┌─────────┴─────────┐
            ▼ (HTTP / Port 3000)│
   ┌──────────────────┐         ▼
   │   HMS Backend    │   ┌───────────┐
   │ (NestJS API App) │   │ Cron Jobs │  <-- Dispatchers (Email/SMS Alerts)
   └────────┬─────────┘   └─────┬─────┘
            │                   │
            └─────────┬─────────┘
                      ▼
       ┌──────────────────────────────┐
       │     PostgreSQL Database      │  <-- Enforces tenant & branch isolation
       └──────────────┬───────────────┘
                      │
                      ▼ (Automated 4-hour Backups)
       ┌──────────────────────────────┐
       │    Amazon S3 Backup Store    │  <-- Encrypted bucket with WORM Object Lock
       └──────────────────────────────┘
```

*   **Compute Instance**: AWS EC2 `t3.large` (2 vCPUs, 8 GB RAM) running Ubuntu 22.04 LTS.
*   **State Persistence**: AWS EBS GP3 Volume (50 GB) with automated daily snapshots.
*   **Database Backup Strategy**:
    *   **Logical Backups**: Automated `pg_dump` runs every 4 hours.
    *   **WAL Archiving**: Postures database for Point-in-Time Recovery (PITR) with transaction logs shipped hourly to Amazon S3.
    *   **Retention**: 7 years to meet statutory healthcare record preservation requirements.
    *   **Immutability**: S3 bucket has WORM (Write-Once-Read-Many) Object Lock enabled to protect against ransomware/deletions.

---

## 3. Service Level Objectives (SLOs) and Error Budgets

To keep targets realistic for a solo developer or very small engineering team, we avoid over-promising (e.g., "five nines") and focus on numbers that balance clinic operations with realistic maintenance windows.

| SLO Category | Target Metric | Target Value | Measurement Window | How it is Measured |
| :--- | :--- | :---: | :---: | :--- |
| **API Availability** | Successful Requests | **99.5%** | Monthly | `(Total Requests - HTTP 5xx) / Total Requests` measured via `/api/v1/admin/metrics` |
| **User-Facing Latency** | Patient Search / Order Creation | **95% in < 800ms** | Monthly | Measured using NestJS `MetricsInterceptor` execution times |
| **Uptime (External)** | Endpoint Ping Success | **99.5%** | Monthly | External monitoring tool (e.g., UptimeRobot) pinging `GET /api/v1/admin/health` every 60s |
| **RPO (Data Durability)** | Max Tolerated Data Loss | **<= 1 hour** | Per Incident | Maximum age of transaction WAL logs successfully uploaded to S3 |
| **RTO (Disaster Recovery)** | Recovery Time Objective | **<= 2 hours** | Per Incident | Execution time of the automated restore pipeline script on a fresh compute node |
| **MFA Compliance** | Enforced step-up on sensitive roles | **100%** | Continuous | SQL assertion validating `mfaEnabled = true` for roles: `Branch Admin`, `Doctor`, `Cashier` |

### Monthly Error Budget
*   **Availability Budget**: **3.6 hours of unscheduled downtime** per calendar month.
*   **Latency Budget**: 5% of total user transactions (approx. 4,500 daily requests) are allowed to exceed 800ms during peak load.

---

## 4. Monitoring Mapping

All SLOs directly integrate with existing monitoring hooks in the NestJS application:

1.  **Availability & Error Rates**:
    *   *Endpoint*: `GET /api/v1/admin/metrics`
    *   *Metric*: `totalRequests`, `totalErrors`.
    *   *Alert Trigger*: Spikes in `totalErrors` exceeding 1% over any 5-minute window.
2.  **Infrastructure Health**:
    *   *Endpoint*: `GET /api/v1/admin/health`
    *   *Metric*: Returns database connection status (`connected: true`) and system load metrics.
3.  **Data Durability (RPO)**:
    *   *Telemetry*: Audit logs capture `BACKUP_COMPLETED` events. The automated backup validator script (`scripts/verify-backup-restore.ts`) runs as a post-backup cron job, verifying database health and file sizes.
4.  **MFA Compliance Monitoring**:
    *   *Telemetry*: Audit logs record all `MFA_RECOVERY_CODE_USED` and `MFA_RECOVERY_CODE_REJECTED` events. A nightly cron query scans the `User` table to flag accounts lacking MFA.

---

## 5. On-Call & Incident Playbooks (Solo-Developer Scale)

As a solo/small-team operations footprint, incident management relies on clear prioritization and rapid automated diagnostics.

### 5.1. Incident Classification (Severity Ladder)

*   **SEV-1 (Critical - Clinic Down)**: Core software is unreachable, billing is completely blocked, or patients cannot be checked in.
*   **SEV-2 (High - Major Degraded State)**: Laboratory result uploading is delayed, or queues are not updating.
*   **SEV-3 (Low - Non-Blocking)**: Typo in printable invoice, or UI layout glitches.
*   **SEV-Sec (Security Alert)**: Suspected brute force, compromised credentials, or cross-tenant data access attempt.

### 5.2. Notification Channel
*   **Alerter**: Twilio-integrated monitoring triggers an automated SMS and persistent phone ring on the engineer's device upon a failed ping on `GET /api/v1/admin/health` or when the API error rate > 5% for 3 consecutive minutes.

### 5.3. SEV-1 Critical Playbook
1.  **Acknowledge**: Turn off the alarm within 5 minutes.
2.  **Ping Check**: Attempt to curl `/api/v1/admin/health`.
    *   *If 502/504 Bad Gateway*: NGINX is alive, but NestJS application is down. SSH into instance and check process: `docker ps`.
    *   *If No Connection*: Compute instance is offline or network interface is blocked. Log into the AWS Console and verify EC2 health checks.
3.  **Database Inspection**:
    *   Verify Postgres container memory consumption.
    *   Check for transaction deadlocks: `docker logs hms-postgres`.
4.  **Rollback vs. Patch Decision**:
    *   If the issue was triggered by a recent release, **never try to patch forward**. Perform an immediate git revert and push to restore the previous known-good image:
        ```bash
        git revert HEAD
        git push origin main
        ```
5.  **Disaster Recovery**:
    *   If database corruption occurred, trigger the backup restore automation script:
        ```bash
        npx ts-node scripts/verify-backup-restore.ts --restore <latest-s3-backup>
        ```

### 5.4. SEV-Sec Incident Playbook
1.  **Isolate Affected User**: If a breach is suspected on a specific credential, execute the stateful session revocation pipeline by incrementing the user's `tokenVersion` in the database to instantly invalidate all JWTs:
    ```sql
    UPDATE "users" SET "token_version" = "token_version" + 1 WHERE "id" = 'target-user-id';
    ```
2.  **Firewall Isolation**: Block any malicious IP addresses at the AWS Security Group level.
3.  **Audit Extraction**: Export audit log table rows filtered by the incident timeframe to forensic files.
4.  **Clinic Disclosure**: Inform the clinic's designated compliance officer of the potential security event and immediate mitigations taken.

---

## 6. Phased Rollout Plan

The rollout spans 4 specific, gate-controlled phases to eliminate "launch-and-pray" risks.

### Phase 0: Sandbox Validation
*   **Goal**: Ensure the exact target clinic configuration works flawlessly on identical hardware.
*   **Entry Criteria**: Public main branch compiles and E2E tests are 100% passing.
*   **Exit Criteria**:
    *   Stress scripts run without failure.
    *   Manual verification that `/api/v1/admin/health` works.
    *   `verify-backup-restore.ts` passes end-to-end sandbox verification.
*   **Rollback Criteria**: N/A (non-production environment).

### Phase 1: Shadow Mode (2 Weeks)
*   **Goal**: Validate data calculation correctness and load behaviors under daily clinic operational stress.
*   **Operational Setup**: The clinic runs their existing legacy paper/software system as the source of truth. Selected encoders double-enter a random 10% subset of patient records, laboratory test orders, and billing invoices into Gemini-HMS.
*   **Entry Criteria**: Phase 0 exit criteria met; staff successfully completes 2 hours of online training.
*   **Exit Criteria**:
    *   Billing totals and lab values entered in Gemini-HMS match legacy systems 100% on reconciled counts.
    *   No SEV-1 or SEV-2 bugs reported during the 14-day window.
*   **Rollback Criteria**: Revert immediately if any calculation mismatch or data corruption is identified.

### Phase 2: Limited Production (2 Weeks)
*   **Goal**: Move active production traffic for a single department/location onto Gemini-HMS.
*   **Operational Setup**: Main Branch goes live. Annex Branch remains on the legacy system.
*   **Entry Criteria**: Phase 1 successfully completed.
*   **Exit Criteria**:
    *   14 consecutive days of clean cashier reconciliation without variance.
    *   99.5% API availability SLO maintained.
*   **Rollback Criteria**: If a SEV-1 incident takes longer than 60 minutes to resolve, shift encoders back to legacy paper tickets.

### Phase 3: Full Production
*   **Goal**: Transition both branches and all modules to Gemini-HMS as the absolute system of record.
*   **Entry Criteria**: Phase 2 successfully exited.
*   **Exit Criteria**: Weekly operations check-in with the clinic reports zero unresolved high-severity bugs.

---

## 7. Remaining Operational Risks

*   **Risk 1: Single-Node Deployment (No HA)**: The application database and API run on a single EC2 host. A host failure will trigger a complete service interruption.
    *   *Status*: **Accepted for First Clinic**. Mitigated by AWS EBS automatic volume recovery and an RTO of <= 2 hours.
*   **Risk 2: Manual Backup-Restore Validation Trigger**: While backups are fully automated, backup validation checks run on a cron cadence but require manual audit verification.
    *   *Status*: **Accepted for First Clinic**. Scheduled for complete automation in Phase 3.
*   **Risk 3: Solo Engineer Coverage**: No formal 24/7 follow-the-sun on-call rotation.
    *   *Status*: **Accepted for First Clinic**. The clinic's operational hours are strictly 08:00 AM – 06:00 PM, aligning with the developer's core availability.

---

## 8. Final Recommendation

> [!IMPORTANT]
> **READY TO APPROACH FIRST CLINIC**

The system's core workflows are fully hardened, E2E tests are 100% passing, and the transaction-bound audit trail is completely bulletproof. With the realistic SLO metrics and structured rollout pipeline defined above, we are highly prepared to onboarding **Clinic A** in Shadow Mode.
