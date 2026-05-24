# Phase 21: Demo Request Review Checklist

Perform this review for every scheduled demo to ensure absolute safety and adherence to boundaries.

## 1. Compliance Prerequisite
- [ ] **Boundary Acknowledgement**: Confirm the requestor has explicitly acknowledged that the demo uses **synthetic data only**.
- [ ] **No PHI Receipt**: Verify that NO real patient data was received via email or chat during the scheduling process.
- [ ] **Local Green State**: Confirm the requestor understands the system is in a "local verified" state, not live on the cloud.

## 2. Technical Pre-Flight
- [ ] **Hardened Baseline**: Confirm the operator is running the current verified `main` branch.
- [ ] **No-PHI Script**: Verify that `npm run db:check:demo` was run 15 minutes before the call.
- [ ] **Aggregate Only**: Confirm the operator knows NOT to modify scripts to show patient-level details.

## 3. Engagement Guardrails
- [ ] **Role Fit**: Verify the stakeholders attending are relevant (e.g., Medical Director, IT Lead).
- [ ] **Attachment Check**: If documents were sent (e.g., `technical-architecture.md`), verify they are the approved truthful versions.

## 4. Post-Demo Path
- [ ] **Proposal Readiness**: Ensure the `staging-proposal-checklist.md` is ready if the demo succeeds.
- [ ] **Next Action**: Assign a follow-up owner immediately.

## Stop Criteria
- **Real Data Demand**: If the prospect insists on seeing their own data -> **CANCEL**.
- **Certification Barrier**: If the prospect requires immediate ISO/SOC2 certificates to proceed -> **PAUSE** and provide technical posture doc only.
