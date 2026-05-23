# Gemini-HMS Demo Runbook

## Objective
Demonstrate the core clinical and security features of Gemini-HMS using synthetic data in a local/verified environment.

---

## 1. Preparation
- [ ] **Environment**: Ensure backend and frontend are running (`npm run start:dev` / `npm run dev`).
- [ ] **Database**: Verify synthetic seed data is applied (`npx prisma migrate status`).
- [ ] **Browser**: Open a fresh incognito/private window to clear any existing cookies.
- [ ] **Data Check**: Confirm NO real patient data is present in the database.

## 2. Sequence A: Staff Workflow
1. **Login**: Authenticate as `Doctor` (Staff).
2. **Dashboard**: Highlight the role-specific sidebar (EMR/Clinical focus).
3. **Queue**: Navigate to the patient queue. Select a synthetic patient (e.g., `[DEMO] Jane Doe`).
4. **Clinical Entry**:
   - Enter mock vitals (BP: 120/80, Temp: 37.0).
   - Save a Draft SOAP note.
   - Click "Sign SOAP" to demonstrate the audit trigger.
5. **Lab Order**: Create a clinical order for a `Full Blood Count`.

## 3. Sequence B: Lab & Pharmacy
1. **Switch Role**: Logout and login as `Lab Manager`.
2. **Result Encoding**: Find the order for `Jane Doe`. Encode a synthetic result (e.g., RBC: 5.0).
3. **Validation**: Validate and Release the result.
4. **Switch Role**: Logout and login as `Pharmacist`.
5. **Dispense**: Navigate to the Pharmacy Queue. Select a prescription for `Jane Doe`. Click `Dispense` and explain the atomic inventory deduction.

## 4. Sequence C: Patient Access
1. **Login**: Login as `Jane Doe` (Patient).
2. **Dashboard**: Show the simplified, patient-friendly dashboard.
3. **Verification**: View the newly released lab result and medical history.
4. **Isolation**: Attempt to navigate to `/admin` or `/billing` (staff routes) to show the "Restricted Access" fallback.

## 5. Sequence D: Security Audit
1. **Admin Review**: Logout and login as `Super Admin`.
2. **Audit Log**: Navigate to `Admin -> Audit Logs`.
3. **Demonstrate**: Show the entry for "SOAP Signed" or "Medication Dispensed," highlighting the timestamp and user signature.

---

## Failure Fallbacks
- **Live Crash**: Revert to the `docs/client-handoff/screenshot-checklist.md` to walk through features via static images.
- **API Error**: Explain the forensic logging that captures the error and prevents data corruption.
