# Client-Funded Staging Checklist

To move from the "Local Green" demo to an operational staging environment, the following infrastructure and funding must be secured.

## 1. Funding Model Options
- [ ] **Option A: Client-Owned Cloud**: Client provisions a project on GCP/AWS and grants IAM access.
- [ ] **Option B: Vendor-Managed Cloud**: Client funds a monthly invoice for staging costs (~$50-$150 USD/mo).

## 2. Infrastructure Requirements
- **Compute**: 1x VM (2 vCPU, 4GB RAM minimum).
- **Database**: Cloud SQL PostgreSQL 15+.
- **Network**: SSL/TLS certificate for staging domain.

## 3. Staging Access Requirements (IAM)
- [ ] `Service Usage Admin` (to enable APIs).
- [ ] `Compute Admin` (to manage application VM).
- [ ] `Cloud SQL Admin` (to manage database).
- [ ] `Artifact Registry Read/Write` (if using custom images).

## 4. Acceptance Criteria for Phase 21
1. **Deployment Success**: Backend and Frontend accessible via HTTPS.
2. **Migration Clean**: All database migrations applied without failure masking.
3. **Smoke Tests**: Login, Triage, Lab, and Pharmacy workflows verified on-server.
4. **Load Test**: Verification of 20+ concurrent users with stable p95 latency.

---
**Note**: The completion of this checklist is the mandatory prerequisite for any real patient data entry or production pilot.
