# HIPAA Compliance Automation Checklist

This document details the automated compliance controls, administrative safe-harbors, and operational audit pathways implemented in the HMS backend platform to satisfy the **HIPAA Security Rule** and the **HITECH Act**.

---

## 1. Access Auditing & Monitoring (ePHI Logs)
*   **Implementation Status**: Fully Automated
*   **Platform Control**: `HipaaComplianceService.auditEphiAccess`
*   **Audit Scope**:
    *   Logs every query, update, or export containing patient identifiers or clinical records (encounters, vitals, prescriptions, diagnoses, lab results).
    *   Tracks full execution context: `userId`, `tenantId`, `ipAddress`, `userAgent`, `sessionId`, and `activeRole`.
    *   Secures forensic authenticity via **SHA-256 Block Chaining** and **HMAC-SHA256 signatures** (preventing trace deletion).

## 2. Dynamic Breach Identification
*   **Implementation Status**: Active Analytics Heuristics
*   **Platform Control**: `HipaaComplianceService.detectUnauthorizedAccess`
*   **Heuristics Evaluated**:
    *   *Role Anomalies*: Detects receptionists or cashiers attempting direct read/mutation of clinical encounter charts.
    *   *Bulk Exfiltration*: Flags sudden bulk patient data queries exceeding a threshold within short intervals.
    *   *Cross-Tenant Access*: Instantly halts and flags any query attempting to cross isolation boundaries.
*   **Breach Reporting**: `HipaaComplianceService.generateBreachReport` outputs structured regulatory logs ready for direct **HHS OCR Portal** reporting.

## 3. Mandatory Data Retention Policies
*   **Implementation Status**: Automated Lifecycle Engine
*   **Platform Control**: `DataRetentionService.enforceRetention`
*   **Retention Period**: 6 Years (statutory requirement under HIPAA § 164.316).
*   **Mechanism**:
    *   Identifies records older than 6 years across 5 primary models (`Patient`, `Encounter`, `LabResult`, `Invoice`, `Payment`).
    *   Soft-archives records (assigning `archivedAt` and `archiveReason`), isolating them from regular clinical workflows.
    *   Restores data only via high-privilege `Super Admin` endpoints.

## 4. Transmission & Encryption (ePHI Masking)
*   **Implementation Status**: Automated Providers
*   **Platform Control**: Global notification outbox & email/SMS masking.
*   **Mechanism**:
    *   EPHI fields (emails, phone numbers, identifiers) are fully masked during transport and log printouts (`m***@h***.com`).
    *   All outbound communication stubs enforce TLS transport encryption.
    *   E-Rx integration utilizes secure **Surescripts / NCPDP SCRIPT v2017071** compliant XML/JSON payload transmission.

## 5. Administrative Safeguards
*   **Multi-Factor Authentication (MFA)**: Mandatory step-up verification for Finance, HR, and Super Admin roles.
*   **Role-Based Access Control (RBAC)**: Fine-grained decorators (`@Roles`) restricting clinical endpoints to authenticated Doctor/Nurse roles and tenant boundaries.
