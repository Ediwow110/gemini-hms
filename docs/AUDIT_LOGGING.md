# Audit Logging Standard

## Overview
Gemini HMS implements a cryptographic, tamper-evident audit logging engine. All high-risk mutations are captured in a blockchain-style chain signed with HMAC SHA-256.

## Audited Events
1. **Security Operations**: User suspension, MFA resets, role changes, locked account overrides, and session terminations.
2. **Clinical Updates**: Lab result releases, vitals marks-in-error, triage corrections, and signed EMR SOAP notes.
3. **Financial Mutations**: Cashier session closings, invoice voids, HMO claims reconciliation, and refund issuance.
4. **Data Administration**: Tenant state updates, branch configuration adjustments, and patient merges.

## Audit Entry Schema
Each log entry records:
- `actorUserId`: The identity of the operator.
- `tenantId` & `branchId`: Scopes validating transaction bounds.
- `eventKey`: Standardized name of the event type.
- `recordType` & `recordId`: Target resource database identifier.
- `oldValues` & `newValues`: Change details (visible strictly to Super Admin).
- `ipAddress` & `userAgent`: Client metadata.
- `hash` & `previousHash`: Cryptographic integrity components.
- `signature`: Signature signed using system secret key.
