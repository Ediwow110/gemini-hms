# Staff Onboarding and Offboarding Lifecycle Flow

## Onboarding Flow
1. **HR Profile Creation**: HR managers add a new employee profile to the system with their details, contact information, and role template under `/hr/employees`.
2. **License Verification**: For clinical roles (Doctors, Nurses, Lab Techs, Pharmacists), their license numbers must be registered and verified. The profile stays in `Pending Approval` state until validated.
3. **Branch Assignment**: Branch Admin assigns the employee to their active branch location, updating their database record with `branchId`.
4. **Account Provisioning**: IT Support/Admin triggers account creation. The system generates a secure invitation token and emails it to the user.
5. **Security Setup**: Upon first login, the user sets a secure password and configures Multi-Factor Authentication (MFA). Their account state shifts to `Active`.

## Offboarding Flow
1. **Session Termination**: HR/Admin initiates employee termination `/hr/termination`.
2. **Immediate Lock**: The system changes the user login status to `OFFBOARDED` and sets the `status` of their `User` account to `SUSPENDED` or `LOCKED`.
3. **Session Revocation**: The authorization database invalidates all active session cookies and JSON Web Tokens (JWT) using token version increments, immediately ejecting the user from active client devices.
4. **Audit Trail**: Every onboarding and termination step creates a signed audit event with reason capture.
