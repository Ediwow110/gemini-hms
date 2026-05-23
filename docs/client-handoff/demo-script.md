# Gemini-HMS Demo Script

## Disclaimer
**ENVIRONMENT**: Demo/Local Environment Only.
**DATA**: Synthetic/Demo Data Only. **No real patient data is used in this demonstration.**

---

## 1. Staff Login & RBAC
- **Action**: Navigate to `/login`. Log in as a `Doctor`.
- **Talk**: "Gemini-HMS uses role-based access control. Notice how the sidebar only shows clinical modules relevant to a physician."
- **Action**: Log out. Log in as a `Pharmacist`.
- **Talk**: "Now we see the Pharmacy Workspace. This user cannot access medical records they aren't authorized to see."

## 2. Patient Portal Separation
- **Action**: Log in as a `Patient`.
- **Talk**: "The patient portal is strictly isolated. Patients can only see their own records and cannot access staff-only APIs or endpoints."

## 3. Clinical Workflow
- **Action**: (Staff) Go to the `Queue`. Select a patient.
- **Action**: Enter `Vitals` and `Triage` data.
- **Talk**: "Clinical data entry is guarded. We only allow 13 specific types of clinical mutations to ensure data integrity."
- **Action**: Save a `Draft SOAP` note, then `Sign` it.
- **Talk**: "Notes are versioned and audited. Once signed, the audit trail captures the forensic hash of the entry."

## 4. Laboratory Workflow
- **Action**: Go to `Lab Dashboard`.
- **Action**: Encode a result for a pending order (`Draft`).
- **Action**: Switch to a `Lab Manager` role (or Super Admin).
- **Action**: `Validate` the result, then `Release` it.
- **Talk**: "The lab workflow follows a strict 3-stage validation process to prevent erroneous data from reaching the patient."

## 5. Pharmacy Workflow
- **Action**: Go to `Pharmacy Hub`.
- **Action**: View the `Dispense Queue`.
- **Action**: Click `Dispense` for an active prescription.
- **Talk**: "Dispensing is atomic. The system simultaneously records the dispense event and deducts stock from the inventory in a single transaction."

## 6. Audit & Security
- **Action**: Go to `Admin -> Audit Logs`.
- **Talk**: "Every sensitive action—like viewing PHI or dispensing drugs—is logged. These logs are hashed to prevent tampering."
- **Talk**: "Under the hood, we use httpOnly cookies and CSRF protection to prevent common web attacks."

## 7. Closing
- **Talk**: "Gemini-HMS is a security-hardened foundation. The next logical step is a client-funded staging deployment to validate this at scale on cloud infrastructure."
