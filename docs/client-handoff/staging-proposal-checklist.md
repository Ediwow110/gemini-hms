# Staging Proposal Checklist — Gemini-HMS

Use this checklist to prepare a formal staging proposal for a qualified prospect who has completed a successful demo.

## 1. Scope of Staging

- [ ] Deploy Gemini-HMS backend and frontend to a dedicated cloud environment.
- [ ] Configure CI/CD pipeline from repository to staging (GitHub Actions).
- [ ] Apply all database migrations.
- [ ] Seed with synthetic demo data (or prospect-approved test data — no PHI).
- [ ] Verify end-to-end clinical workflows (login → triage → SOAP → orders → lab → pharmacy).
- [ ] Run security baseline verification (CSRF, httpOnly cookies, RBAC, audit).
- [ ] Document known limitations and current Local Green status.

## 2. Required Client Inputs

- [ ] Cloud project / account access or agreement to fund vendor-managed option.
- [ ] IAM roles granted (Service Usage Admin, Compute Admin, Cloud SQL Admin, Artifact Registry).
- [ ] Domain name for staging (optional but recommended for HTTPS).
- [ ] Preferred lab test catalog and pharmacy inventory list (optional — synthetic defaults available).
- [ ] Point of contact for technical coordination (IT lead or named delegate).
- [ ] Approval to use GitHub Actions for deployment automation.

## 3. Cloud Account / Funding Model

| Option | Description | Estimated Monthly Cost |
| :--- | :--- | :--- |
| **A: Client-Owned Cloud** | Client provisions GCP/AWS project, grants IAM access. | ~$50–150 (client pays cloud provider directly) |
| **B: Vendor-Managed Cloud** | Client sends fixed monthly invoice to cover staging infrastructure. | ~$50–150 (client pays vendor, vendor manages cloud) |

- [ ] Client has an existing GCP/AWS account.
- [ ] Client prefers vendor-managed Option B.
- [ ] Client needs a cost estimate for budget approval.

## 4. IAM / Secrets / Domain Requirements

- [ ] Service Usage Admin — to enable required APIs.
- [ ] Compute Admin — to manage the application VM.
- [ ] Cloud SQL Admin — to manage PostgreSQL database.
- [ ] Artifact Registry Read/Write (if using custom container images).
- [ ] Secrets managed via environment variables or cloud secret manager — never in code.
- [ ] SSL/TLS certificate provisioned for staging domain.

## 5. Synthetic or Migrated Data Boundary

- [ ] **No real patient data** allowed in staging.
- [ ] If client wants to test with their own data, only de-identified / synthetic derivatives are permitted.
- [ ] A data migration scope can be defined for Phase 22 (post-staging), but is out of scope for this proposal.

## 6. Smoke Test Plan

- [ ] Backend health endpoint responds 200.
- [ ] Frontend loads at staging URL.
- [ ] Demo user login (Doctor, Nurse, Pharmacist, Patient, Admin).
- [ ] Create patient → triage → record vitals → write SOAP → sign.
- [ ] Create clinical order → receive lab order → encode → validate → release.
- [ ] Pharmacy: view prescription queue → dispense medication.
- [ ] Patient portal: log in → view lab results.
- [ ] Audit log: confirm each mutation recorded.

## 7. Load Test Plan

- [ ] Simulate 10 concurrent users performing mixed clinical workflows.
- [ ] Simulate 20 concurrent users performing mixed clinical workflows.
- [ ] Measure p95 response time for: login, patient search, SOAP save, lab result release, pharmacy dispense.
- [ ] Target: p95 < 2 seconds for all operations under 20 concurrent users.
- [ ] Identify bottlenecks and tune if needed.
- [ ] Report results to client.

## 8. Security Review Plan (Staging)

- [ ] Run `verify:security` script — must pass.
- [ ] Verify httpOnly cookies and CSRF protection work via staging URL.
- [ ] Verify tenant/branch isolation: Branch A user cannot see Branch B data.
- [ ] Verify synthetic data only — no PHI in database.
- [ ] Verify no secrets in environment output, logs, or error pages.
- [ ] Document any findings for production hardening.

## 9. Acceptance Criteria

- [ ] All smoke tests pass.
- [ ] Load test meets p95 targets.
- [ ] Security verification passes.
- [ ] No real patient data detected.
- [ ] Client confirms staging is usable for evaluation.
- [ ] Known limitations documented and acknowledged.

## 10. Estimated Timeline

| Milestone | Estimated Duration |
| :--- | :--- |
| Cloud provisioning and IAM setup | 3–5 business days (depends on client) |
| Deployment and migration | 1–2 business days |
| Smoke test and bug fixes | 2–3 business days |
| Load test | 1 business day |
| Security review | 1 business day |
| Client acceptance | 2–3 business days |
| **Total estimated duration** | **10–15 business days** |

## 11. What is Out of Scope (This Proposal)

- Production deployment (Phase 23+).
- HIPAA / SOC2 certification audit (Phase 24+).
- Real patient data migration (Phase 22+).
- eRx or insurance clearinghouse integration (not planned).
- ONC EHR certification (not planned).
- Custom integrations with proprietary lab machines or external EHRs.
- Staff training beyond basic demo walkthrough.
- 24/7 support or SLA guarantees.
- Load testing beyond 20 concurrent users.

## 12. Production Readiness Path (Beyond This Proposal)

After staging is accepted, the following are required before any production use:
1. Formal penetration test by external firm.
2. Backup / restore drill with documented RTO/RPO.
3. Monitoring and alerting implementation (SIEM).
4. Compliance legal review and BAA execution.
5. Client production cloud account provisioning.
6. Final infrastructure hardening (VPC, IAM least privilege, encryption at rest).
7. Go-live plan and rollback procedure.

---

**Owner**: Technical Lead
**Last Updated**: 2026-05-24
**Status**: Template — customize per prospect
