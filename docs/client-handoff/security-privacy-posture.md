# Gemini-HMS Security & Privacy Posture

## Security Hardening (Completed)
- **Auth**: Fully migrated to `httpOnly`, `SameSite=Strict` cookies. No JWTs are accessible via JavaScript.
- **CSRF**: Double-submit cookie pattern implemented for all non-GET requests.
- **Isolation**: Tenant and Branch isolation is enforced at the controller level via custom guards.
- **Audit**: Every clinical and financial mutation is recorded in a tamper-evident audit log.
- **Mutation Boundary**: The system enforces a strict clinical allowlist of 13 mutations (Vitals, Triage, SOAP, Orders, Labs, Pharmacy Dispense).

## Privacy Posture
- **Data Minimization**: PHI is only returned when the user role explicitly requires it for care delivery.
- **Masking**: Patient names and sensitive identifiers are masked by default in administrative views.
- **Demo-Data Boundary**: **Gemini-HMS has never been exposed to real patient data.** All demonstration flows utilize synthetic data.

## Known Gaps (Before Production)
The following are **REQUIRED** before any real patient usage or production launch:
1. **Formal Penetration Test**: An external security firm must audit the live staging environment.
2. **Compliance Legal Review**: Verification of "Business Associate Agreements" (BAA) with cloud providers.
3. **Formal Backup/Restore Drill**: Proof of data recovery within documented RTO/RPO.
4. **Cloud Infrastructure Hardening**: Finalization of IAM roles and VPC boundaries in the production project.
5. **Monitoring & Alerting**: Implementation of real-time security incident alerting (SIEM).

## What Cannot Be Claimed Yet
- **NOT HIPAA Certified**: While designed for HIPAA compliance, certification is a legal/operational process that requires a live environment audit.
- **NOT SOC2 Certified**: SOC2 requires months of operational evidence in a provisioned environment.
- **NOT Production Ready**: The system is in a "Local Green" state, awaiting final cloud-scale validation.
