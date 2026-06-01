# File / Report / PDF Exposure Audit

**Phase:** S14  
**Date:** 2026-06-01  
**Branch:** `security/s14-file-report-access-audit`  
**Verdict:** STAGING-ONLY / file and report access audit  

---

## 1. Executive Summary

Audit of file, report, PDF, download, and export endpoints for unauthorized access and data leakage.

---

## 2. Findings

### PDF/Download Endpoints (Patient Portal)
- `GET /api/v1/patient-portal/lab-results/:id/pdf` — patient JWT required
- `GET /api/v1/patient-portal/invoices/:id/pdf` — patient JWT required
- `GET /api/v1/patient-portal/prescriptions/:id/pdf` — patient JWT required
- `GET /api/v1/patient-portal/payments/:id/receipt` — patient JWT required
- All PDF endpoints are `@Public()` but have `@UseGuards(PatientJwtGuard)` — correct

### Report/Export Endpoints
- Reports controller uses `@UseGuards(JwtAuthGuard, RolesGuard)` — authenticated + role-checked
- No direct file download endpoints outside patient portal
- No unauthenticated file access

### Risk Assessment
- All download endpoints are authenticated with JWT
- Patient-scoped access enforced via `patientId` from JWT
- No broad export endpoints without auth
- No file upload endpoints found

### STAGING-ONLY / file and report access audit complete.
