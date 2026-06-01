# Destructive Action and Approval Safety Audit

**Phase:** S17  
**Date:** 2026-06-01  
**Branch:** `security/s17-destructive-action-safety-audit`  
**Verdict:** STAGING-ONLY / destructive action safety audit  

---

## 1. Executive Summary

Audit of dangerous state-changing flows: delete, archive, deactivate, approve, void, refund, patient merge, role changes.

---

## 2. Findings

### Delete/Archive/Deactivate
- Patient records: soft-delete via status, not hard-delete
- Users: deactivated via `deactivatedAt` field
- Invoices: voided, not deleted
- All deletions are auth + role-checked
- No hard-delete endpoints exposed

### Approvals
- `approvals.service.ts`: approval requests require auth + role check
- Self-approval guard: `self-approval.guard.ts` — prevents self-approval
- Approval requests are audit-logged

### Billing Void/Refund
- Void: requires role check + audit log
- Refund: requires role check + approval workflow
- Idempotency records prevent duplicate processing

### Patient Merge
- `patient-merge-request.service.ts`: requires auth + role
- Merge is audited, tenant-scoped
- Soft-merge (records preserved, linked)

### Role/Permission Changes
- `admin.service.ts`: role updates require auth + admin role
- Permission changes are audit-logged
- No self-escalation possible

### Assessment
All destructive actions are authenticated, role-checked, and audit-logged. Self-approval is blocked. No critical gaps found.

**STAGING-ONLY / destructive action safety audit complete.**
