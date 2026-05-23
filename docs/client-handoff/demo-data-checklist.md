# Gemini-HMS Demo Data Checklist

This checklist ensures the demo environment is prepared with appropriate, non-PII, synthetic data.

## 1. Administrative Setup
- [ ] **Demo Tenant**: `[DEMO] Alpha Medical Group`.
- [ ] **Demo Branch**: `Main Clinic Branch`.
- [ ] **Roles**: Standard roles (Doctor, Nurse, Pharmacist, Lab Manager, Cashier, Patient) fully mapped.

## 2. Synthetic Users
- [ ] **Doctor**: `dr.smith@demo.local`
- [ ] **Pharmacist**: `ph.jones@demo.local`
- [ ] **Patient**: `jane.doe@demo.local` (Linked to patient profile).

## 3. Synthetic Patient Profile
- [ ] **Name**: `[DEMO] Jane Doe`
- [ ] **DOB**: `1990-01-01`
- [ ] **Address**: `123 Demo St, Sim City` (Fake).
- [ ] **Phone**: `555-0100` (Synthetic).
- [ ] **History**: 2-3 historical visits with mock vitals.

## 4. Synthetic Clinical Data
- [ ] **Orders**: At least one pending lab order (e.g., `Hemoglobin A1c`).
- [ ] **Prescriptions**: One active prescription (e.g., `Amoxicillin 500mg`).
- [ ] **Inventory**: Mock stock levels for the prescribed medication (e.g., 100 units).

## 5. Lab Catalog
- [ ] **Test Definitions**: Common tests (FBC, Lipid Profile) defined with reference ranges.

## 6. Safety Markers
- [ ] **Labeling**: Every record name or description MUST start with `[DEMO]` or `[SYNTHETIC]`.
- [ ] **Exclusion**: Zero real MRNs, SSNs, or ID numbers.

---
**Verification Step**: Run `SELECT count(*) FROM users WHERE email NOT LIKE '%demo.local%'` before the demo to ensure no unintentional real data exists in the test DB.
