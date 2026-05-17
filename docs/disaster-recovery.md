# Disaster Recovery Manual (HMS Enterprise GA)

This runbook outlines the critical procedures, escalation paths, and commands required to recover the Hospital Management System (HMS) backend and database in the event of a catastrophic failure.

## 1. Disaster Recovery Parameters & Objectives
To align with HIPAA, DPA, and enterprise SLAs, the platform enforces the following recovery targets:
*   **Recovery Time Objective (RTO)**: **< 1 Hour** (Maximum allowable downtime for core EHR/clinical services before business functions are restored).
*   **Recovery Point Objective (RPO)**: **< 15 Minutes** (Maximum allowable data loss window in the event of a database failure).

---

## 2. Crisis Escalation Tree
In the event of a major outage (e.g., active data corruption, cluster-wide failure, or cloud region blackout), follow the escalation chain immediately:

### Severity Level Escalation Path
*   **Initial Triage (0 - 5 Minutes)**: On-Call Site Reliability Engineer (SRE).
*   **CTO Pager Escalation (5 - 10 Minutes)**: Chief Technology Officer (CTO) Pager System.
*   **Executive Board Notify (15 Minutes)**: Chief Medical Officer (CMO) and Legal Counsel (for HIPAA/ePHI breach check).

### Contact Directories
1.  **On-Call SRE**: `sre-oncall@hospital-hms.local` | Phone: `+1 (555) 019-2834`
2.  **CTO Pager Dispatch**: `ctopager@hospital-hms.local` | Phone: `+1 (555) 019-2899` (Sends high-priority SMS alerts via the SLA Alerting Engine)
3.  **Legal & Compliance Officer**: `compliance@hospital-hms.local` | Phone: `+1 (555) 019-2911`

---

## 3. Database Backup & Restore Command Manual

All PostgreSQL backups must be encrypted at rest and stored in multi-region secure S3 buckets.

### A. Manual Backup Execution (pg_dump)
To take a manual snapshot before risky operations:
```bash
# Export the database schema and data in compressed custom format
pg_dump -h localhost -U postgres -d hms_test -F c -b -v -f "/backups/hms_backup_$(date +%F_%T).dump"
```

### B. Full Database Restoration (pg_restore)
In the event of server loss, provision a clean Postgres cluster and run:
```bash
# 1. Terminate existing connections
psql -h localhost -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'hms_test';"

# 2. Drop and Recreate the target database
psql -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS hms_test;"
psql -h localhost -U postgres -d postgres -c "CREATE DATABASE hms_test;"

# 3. Restore schema, indexes, and records from dump
pg_restore -h localhost -U postgres -d hms_test -v "/backups/hms_backup_TARGET_FILE.dump"
```

### C. Verification of Crypto Chain Integrity
After restoration, the cryptographic hash chain MUST be verified to guarantee zero record tampering has occurred:
```bash
# Trigger automated E2E audit chain verification
curl -X GET http://localhost:3000/api/v1/audit/verify-chain \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>" \
  -H "X-Tenant-ID: <TENANT_ID>"
```
Ensure the response returns `{"status": "VALID", "message": "Audit trail is unbroken"}`.

---

## 4. Alternate Region Failover (Kubernetes Ingress Switch)
If the primary cloud region is completely blacked out:
1.  Verify the replica database in the standby region is fully caught up (replica lag `< 5s`).
2.  Promote the secondary database to Primary.
3.  Deploy K8s manifests in the backup cluster:
    ```bash
    kubectl apply -f k8s/deployment.yaml --context=standby-region
    ```
4.  Update global DNS Cloudflare/Route53 routing policies to point traffic to the standby cluster Ingress controller.
