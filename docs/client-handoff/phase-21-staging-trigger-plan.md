# Phase 21: Client-Funded Staging Trigger Plan

## 1. Current Baseline
Gemini-HMS has achieved a **verified "Local Green" baseline** (Commit `001b8837...`, CI Run `26354660813`). 
- **READY**: Local synthetic demos, outreach documentation, hardened demo scripts, 1000+ passing tests.
- **PAUSED**: Cloud deployment, real patient data processing, compliance certification.

## 2. Conditions Required Before Phase 21 Starts (Staging Trigger)
Phase 21 (Cloud Staging) will only commence when **ALL** of the following conditions are met:

- [ ] **Funding**: Client or project owner approval for cloud infrastructure costs (GCP/AWS/Azure).
- [ ] **Account Ownership**: Dedicated cloud project/account created (non-personal).
- [ ] **Billing**: Valid billing account linked to the cloud project.
- [ ] **IAM/Access**: Admin or Contributor level access provided to the deployment team.
- [ ] **Domain/SSL**: DNS access or approved subdomain for staging (e.g., `staging.hms-demo.com`).
- [ ] **Database Plan**: Approved managed database tier (e.g., Cloud SQL) with backup strategy.
- [ ] **Secrets Management**: Plan for secure secret injection (e.g., GitHub Secrets to Secret Manager).
- [ ] **Legal Clearance**: Signed agreement confirming that NO REAL PHI will be uploaded without explicit HIPAA-compliant infrastructure setup and legal sign-off.

## 3. Explicit NO-GO Conditions
Phase 21 deployment **MUST NOT** proceed if:
- [ ] No confirmed budget for cloud resources.
- [ ] Only personal cloud accounts are available (risk of co-mingling).
- [ ] Direct request to use real patient data before HIPAA-compliant BAA is signed.
- [ ] Request to bypass security verifiers or hardening guards.

## 4. Staging Scope
- Infrastructure-as-Code (IaC) or manual provisioning of staging environment.
- CI/CD pipeline extension from "Local Green" to "Cloud Staging".
- Automated smoke tests in the cloud environment.
- Synthetic-only scale validation.

## 5. Out-of-Scope for Phase 21
- **Production Release**: Production remains a distinct, future milestone.
- **Real Patient Data**: Strictly forbidden in Phase 21.
- **Formal Certification**: Phase 21 validates readiness for audit, but is not the audit itself.

## 6. Acceptance Criteria
- [ ] Main branch CI remains green.
- [ ] Staging health endpoint returns `200 OK`.
- [ ] Synthetic data seed successfully applied to cloud DB.
- [ ] Role-based access verified in the deployed environment.
- [ ] Cloud-native audit logs confirmed operational.

## 7. Rollback / Cleanup Plan
- [ ] If staging verification fails: Teardown cloud resources to stop billing.
- [ ] Revert to Phase 20 "Local Green" baseline for continued local demonstration.

## 8. Estimated Responsibilities
### Client Responsibilities:
- Cloud project provisioning and billing.
- Domain/DNS delegation.
- Data privacy legal review.

### Developer Responsibilities:
- Deployment script configuration.
- Environment hardening.
- Smoke test execution and reporting.

## 9. Truthfulness Boundaries
- Maintain "Not Production Ready" framing.
- Strictly no certification claims.
- Strictly no PHI until explicitly cleared.

## 10. Next Action
Wait for client confirmation of Step 2 (Conditions Required) before initializing Phase 21 implementation.
