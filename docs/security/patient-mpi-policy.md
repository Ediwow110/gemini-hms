# Patient Master Patient Index (MPI) Policy

## Context
In Gemini HMS, the Patient model is scoped at the **Tenant** level rather than the **Branch** level.

## Decision
The Patient Master Patient Index (MPI) is intentionally **Tenant-wide**.

## Rationale
1. **Patient Continuity:** Patients often visit different branches of the same hospital system. A tenant-wide MPI allows a unified medical record for the patient across the entire organization.
2. **Duplicate Prevention:** Scoping patients to branches would lead to duplicate records when a patient visits a new branch, making clinical history fragmented and increasing administrative overhead.
3. **Data Integrity:** The `normalizedNameDobKey` (FirstName + LastName + DOB) ensures that a patient cannot be registered twice within the same tenant, regardless of which branch they first visit.

## Access Control & Branch Isolation
While the Patient identity is tenant-wide, clinical and financial activity remains branch-isolated where appropriate:
- **Encounters:** Scoped to the branch where they occurred.
- **Clinical Notes:** Scoped to the branch and protected by branch-context guards.
- **Financial Records (Invoices/Payments):** Scoped to the branch and cashier session.
- **Access:** Users with branch-limited roles can only view clinical/financial activity for their assigned branch, even if they can search for any patient within the tenant.

## Security Implications
- **Searchability:** Authorized staff (Receptionists, Doctors, etc.) can search the entire tenant's patient list to facilitate registration and care continuity.
- **Tenant Isolation:** Cross-tenant patient access is strictly forbidden by database-level `tenant_id` scoping in all queries.
