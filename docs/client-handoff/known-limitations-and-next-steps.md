# Known Limitations & Next Steps

## Known Limitations
1. **Staging Paused**: Deployment to Google Cloud Platform is currently paused due to budget/funding status. Staging is **not live**.
2. **No Real Data**: The system is strictly synthetic-only. Do not attempt to input real PHI into the demo.
3. **Certification Status**: No formal HIPAA, SOC2, or local healthcare regulatory certifications have been obtained.
4. **Performance**: Load testing has been simulated locally but not verified at scale on cloud hardware.
5. **Feature Gaps**:
   - No electronic prescriptions (eRx) outside of local stubs.
   - No real-time external lab integrations (interfaces are stubs).
   - No automated insurance clearinghouse connections (logic is simulated).

## Recommended Next Steps (Phase 21)
1. **Client-Funded Staging Deployment**: Provision real cloud resources to move beyond local verification.
2. **End-to-End Smoke Tests**: Verify auth and clinical workflows on public-facing HTTPS endpoints.
3. **Live Load Testing**: Confirm the system handles 50+ concurrent users on target hardware.
4. **Production Readiness Review**: Perform the final audit of backup, disaster recovery, and monitoring systems.
5. **Security Penetration Test**: Commission a 3rd party audit of the staging environment.
