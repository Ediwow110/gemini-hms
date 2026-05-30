# First Admin Bootstrap Runbook

## Purpose

Guide the operator through creating the first administrative user in a newly deployed HMS environment.

## How First Admin Should Be Created

Use the application's seed or bootstrap mechanism. Do **not** insert user records directly into the database unless absolutely necessary.

### Using the Seed Script

```bash
cd hms-backend
npx prisma db seed
```

This creates the initial tenant, branch, and admin user as defined in the seed configuration.

### Manual Bootstrap (if seed is unavailable)

If the seed script cannot be used, create the admin through the sign-up flow with the `Super Admin` role assigned:

```bash
# Example: using the API directly
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "<temporary-strong-password>",
    "tenantId": "<tenant-id>",
    "role": "Super Admin"
  }'
```

After creation, assign the user to the appropriate branch via the role assignment endpoint.

## Secrets Required

- Admin email address
- Temporary strong password (generated, not reused)
- Tenant ID (if multi-tenant)
- Branch ID (default branch)

All secrets must be delivered securely (not via email, chat, or source code).

## MFA Expectation

The first admin must enable MFA immediately after first login:

1. Log in with temporary credentials
2. Navigate to profile settings
3. Enable MFA using the authenticator app
4. Scan the QR code and confirm setup
5. Store the MFA recovery codes securely

## Tenant and Branch Assumptions

- A default tenant exists or is created during bootstrap
- At least one branch exists for the tenant
- The first admin is assigned to the default branch
- Additional tenants and branches can be created after bootstrap

## Audit Logging Expectation

All bootstrap actions must be recorded in the audit log:

- User creation event
- Role assignment event
- First login event
- MFA enablement event

Verify audit logging after bootstrap:

```bash
curl -X GET http://localhost:3000/api/v1/audit?userId=<admin-user-id> \
  -H "Authorization: Bearer <admin-token>"
```

## Revocation Procedure if Bootstrap Credentials Are Compromised

If the bootstrap credentials are suspected compromised:

1. Revoke all sessions:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/revoke-all-sessions \
     -H "Authorization: Bearer <admin-token>"
   ```
2. Change the admin password immediately.
3. Rotate JWT_SECRET if token-level compromise is suspected.
4. Review audit logs for unauthorised access.
5. Create a new admin user and revoke the compromised one.
6. Document the incident and follow incident-response.md.

## Post-Bootstrap Checklist

- [ ] Admin user can log in
- [ ] MFA is enabled
- [ ] Tenants and branches verified
- [ ] Audit log contains bootstrap events
- [ ] Temporary credentials revoked
- [ ] Admin can access the admin portal
- [ ] Admin can create additional users
- [ ] Recovery codes stored securely offline

---

**Note**: This runbook is operator readiness scaffolding. It does not imply production readiness or compliance certification.
