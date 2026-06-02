# NG-7: Final Non-GCP Staging-Equivalent Runtime Report

**Date**: 2026-06-02
**Branch**: runtime/ng7-non-gcp-final-report
**Verdict**: STAGING-ONLY / NON-GCP STAGING-EQUIVALENT RUNTIME PROOF COMPLETE

---

## 1. Executive Summary

NG-0 through NG-6 are complete. The deployed non-GCP staging-equivalent path (Vercel + Render + Neon) is proven end-to-end with demo data only.

- All critical runtime checks (HTTPS, CORS, API routing, auth/session, verifiers, secret exposure) passed.
- No secrets, real PHI, or production claims committed.
- GCP remains parked due to IAM blocker.

**This is staging-equivalent evidence only. Full production readiness is NOT complete.**

---

## 2. Final Verdict

**STAGING-ONLY / NON-GCP STAGING-EQUIVALENT RUNTIME PROOF COMPLETE**

---

## 3. Phase Inventory

| Phase | Title | Status | PR | Verdict | Evidence |
|-------|-------|--------|----|---------|----------|
| NG-0 | Non-GCP platform decision | Merged | #164 | STAGING-ONLY / NON-GCP PLATFORM SELECTED | non-gcp-runtime-platform-decision.md |
| NG-1 | Env/secret inventory | Merged | #165 | STAGING-ONLY / NON-GCP ENV INVENTORY COMPLETE | non-gcp-env-secret-inventory.md |
| NG-2 | Hosted Postgres migration + seed | Merged | #166 | STAGING-ONLY / HOSTED POSTGRES MIGRATION PROVEN | non-gcp-postgres-migration-proof.md |
| NG-3 | Render backend deployment | Merged | #167 | STAGING-ONLY / NON-GCP BACKEND DEPLOYED | non-gcp-backend-deployment-proof.md |
| NG-4 | Vercel frontend deployment | Merged | #168 | STAGING-ONLY / NON-GCP FRONTEND DEPLOYED | non-gcp-frontend-deployment-proof.md |
| NG-5 | E2E smoke proof | Merged | #169 | STAGING-ONLY / NON-GCP E2E SMOKE PROVEN | non-gcp-e2e-smoke-proof.md |
| NG-6 | Runtime/security verification | Merged | #170 | STAGING-ONLY / NON-GCP SECURITY RUNTIME VERIFIED | non-gcp-security-runtime-verification.md |
| NG-7 | Final report | Current | Pending | STAGING-ONLY / NON-GCP STAGING-EQUIVALENT RUNTIME PROOF COMPLETE | non-gcp-staging-equivalent-final-report.md |

---

## 4. PR Inventory

- NG-0: #164
- NG-1: #165
- NG-2: #166
- NG-3: #167
- NG-4: #168
- NG-5: #169
- NG-6: #170
- NG-7: pending (this PR)

All PRs are docs-only, green, and mergeable at time of creation.

---

## 5. Platform Topology

- **Frontend**: Vercel (Vite static hosting)
- **Backend**: Render (Docker / Node web service)
- **Database**: Neon PostgreSQL (managed, branchable)
- **No GCP deployment** used in NG track

---

## 6. Runtime URLs

- Frontend: https://gemini-hms.vercel.app
- Backend: https://gemini-hms-api.onrender.com

---

## 7. Database Status (NG-2)

- Neon PostgreSQL staging branch used
- 53 migrations applied successfully
- Demo seed completed (synthetic data only)
- No real PHI
- SSL-required connection

---

## 8. Backend Deployment Status (NG-3)

- Render Docker service deployed
- Build + startup passed
- Connected to migrated Neon DB
- `prisma migrate deploy` ran on startup (idempotent)
- No secrets leaked in logs

---

## 9. Frontend Deployment Status (NG-4)

- Vercel project deployed
- `VITE_API_URL` set to Render backend `/api`
- No localhost, no `/api/api` duplication
- CORS updated to exact Vercel origin

---

## 10. E2E Smoke Status (NG-5)

- Frontend load: PASS
- Backend health: PASS
- Demo login: PASS
- Protected dashboard route: PASS
- CORS: PASS
- No secrets / no real PHI

---

## 11. Runtime/Security Verification Status (NG-6)

- HTTPS: PASS
- Exact-origin CORS: PASS
- Bad-origin rejection: PASS
- API routing: PASS
- Login/session/logout: PASS
- Protected route: PASS
- Wrong-role access: PASS
- Public route verifier: PASS
- Branding guard: PASS
- No committed backups: PASS
- No secrets exposed in logs/console

---

## 12. Dashboard Status

Dashboard track (Admin/Executive, Pharmacy, Lab Diagnostic, Billing/Finance, Clinical Operations) is functionally complete for demo purposes. Historical/aggregation widgets have known mock-data gaps where backend APIs are absent. Not production-ready.

---

## 13. Free-Tier Limitations

- Render free/starter: sleep/cold-start risk (~15 min inactivity)
- Vercel Hobby: usage limits, preview URL churn
- Neon free: limited storage/compute hours, no strong SLA
- No guaranteed uptime or performance under load
- Cold-start latency observed on first request after idle

---

## 14. Remaining Production Blockers

- No production SLA or paid-tier guarantees
- Backup/restore not fully exercised under production constraints
- Hosted monitoring/alerting not fully proven
- Incident response not exercised against live production incident
- Compliance/legal review not performed
- No HIPAA compliance attestation
- No SOC 2 certification
- No production UAT signoff
- No load/performance proof
- No formal DR/RTO/RPO proof
- GCP IAM/staging path remains parked/blocked
- PR #97 (Phase 29 production evidence) still open/stale

---

## 15. What Is Proven

- Non-GCP deploy path selected and executed
- Env/secret inventory completed
- Hosted DB migration + seed proven
- Backend deployed and reachable
- Frontend deployed and correctly wired
- Deployed frontend + backend smoke tested end-to-end
- Runtime security verification completed (HTTPS, CORS, auth, verifiers, secret hygiene)

---

## 16. What Is Not Proven

- Production readiness
- HIPAA compliance
- SOC 2 certification
- Enterprise readiness
- Paid-tier availability / sustained load
- Legal/compliance acceptance
- Full backup/restore exercise under production constraints
- Production monitoring/SLOs
- Disaster recovery

---

## 17. Branch Hygiene Note

- 20 safe merged branches deleted in BH-1
- Remaining branches under review; not automatically safe to delete or merge
- Branch integration remains paused

---

## 18. GCP Status

GCP remains parked. Previous blocker was missing IAM roles (`serviceusage.serviceUsageAdmin`, `compute.admin`, `cloudsql.admin`, `artifactregistry.admin`) on project `unified-xylocarp-j524r`. No GCP deployment proof performed in NG track.

---

## 19. Final Recommendation

**Recommended next strategic move**: Option A — Pause feature work and finish branch hygiene / stale PR cleanup (including PR #97) before resuming production-readiness hardening.

---

## 20. Explicit Non-Claims

- This report does not claim production readiness.
- This report does not claim HIPAA compliance.
- This report does not claim SOC 2 certification.
- This report does not authorize use with real PHI.

---

**END OF NG-7 FINAL REPORT**
