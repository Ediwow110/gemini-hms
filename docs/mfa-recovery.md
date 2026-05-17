# Multi-Factor Authentication (MFA) Recovery & Break-Glass Protocol

This document outlines the architecture, security invariants, API specifications, and operational guide for the MFA recovery mechanism implemented in Gemini-HMS.

---

## 1. Security Architecture & Invariants

To ensure that the multi-factor authentication (MFA) requirement cannot be bypassed or compromised through recovery flows, the system adheres to strict cryptographic and operational principles:

1. **One-Time Use (Single-Use Burn)**: A recovery code can satisfy the MFA challenge exactly once. Upon successful validation, the code is immediately "burned" (marked as used with `usedAt: DateTime` in the database). Subsequent requests attempting to use the same code are rejected.
2. **One-Time Exposure**: Plaintext recovery codes are displayed to the user **exactly once** during generation (usually immediately after setting up MFA or when they explicitly regenerate them).
3. **Secure Hash-Only DB Storage**: Under no circumstances are recovery codes stored in plaintext. They are salted and hashed using **bcrypt** (with 10 rounds) before being saved. The database only ever holds the `codeHash`.
4. **Expiration Limit**: All generated recovery codes are subject to a **30-day expiration window**. Any attempt to use an active code older than 30 days is rejected.
5. **High-Risk Event Auditing**: Every transition in the recovery code lifecycle is audited via the system-wide transaction-bound audit logger with a specific event key:
   - `MFA_RECOVERY_CODES_GENERATED`: Logged when a user invalidates old codes and generates 8 new codes.
   - `MFA_RECOVERY_CODE_USED`: Logged when a user successfully enters a valid recovery code to satisfy their MFA challenge.
   - `MFA_RECOVERY_CODE_REJECTED`: Logged when an invalid, reused, or expired recovery code is supplied.

---

## 2. Database Schema

The recovery code model is defined as follows:

```prisma
model UserMfaRecoveryCode {
  id        String    @id @default(uuid()) @map("id")
  userId    String    @map("user_id")
  codeHash  String    @map("code_hash")
  usedAt    DateTime? @map("used_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_mfa_recovery_codes")
}
```

---

## 3. API Endpoints

### 3.1. Generate Recovery Codes
Generates 8 new cryptographically secure alphanumeric recovery codes for the authenticated user, deleting any existing codes first.

- **URL**: `POST /api/v1/auth/mfa/recovery-codes/generate`
- **Authentication**: Fully authenticated access token (JWT containing `userId` and `tenantId`).
- **Response**: `201 Created`
  ```json
  {
    "recoveryCodes": [
      "1234abcd",
      "5678efgh",
      ...
    ]
  }
  ```
  > [!WARNING]
  > This is the only time the plaintext codes are visible. The client application must instruct the user to print, download, or copy these codes to a secure physical/digital location immediately.

### 3.2. Verify Recovery Code (Break-Glass Authentication)
Verifies a recovery code during the login MFA challenge step-up phase.

- **URL**: `POST /api/v1/auth/mfa/recovery-codes/verify`
- **Headers**:
  - `Authorization`: `Bearer <mfa_challenge_token>` (Restricted scope token received on password validation)
- **Request Body**:
  ```json
  {
    "code": "1234abcd"
  }
  ```
- **Responses**:
  - `200 OK`: Verification successful. Returns fresh tokens.
    ```json
    {
      "accessToken": "eyJhbG...",
      "refreshToken": "48b61c..."
    }
    ```
  - `401 Unauthorized`: Code is invalid, expired, or already burned.
    ```json
    {
      "statusCode": 401,
      "message": "Invalid or expired MFA recovery code",
      "error": "Unauthorized"
    }
    ```

---

## 4. Administrative and Support Guidelines

In the event that a user has completely lost both their MFA TOTP device and their recovery codes, the standard "Break-Glass" protocol is as follows:

1. **Identity Verification**: The support desk must confirm the identity of the user via offline out-of-band communication (e.g., photo ID, direct call verification).
2. **MFA Reset (Admin Maker-Checker Flow)**:
   - A System Administrator must issue an MFA Reset request.
   - According to the **Maker-Checker governance rules**, a second authorized administrator must approve the status change or reset action.
   - Once approved, the user's `mfaEnabled` status is set to `false`, allowing them to log in with their password and immediately set up their MFA and recovery codes fresh.
