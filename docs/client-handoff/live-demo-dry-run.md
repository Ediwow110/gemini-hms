# Live Demo Dry-Run Script (Operational)

## Overview
- **Short Demo**: 15 Minutes (High-level workflow only).
- **Full Demo**: 30 Minutes (Deep dive into audit and security).

---

## 0. Opening Disclaimer (1 Min)
- **Talk**: "Welcome. This is a live demonstration of Gemini-HMS running in a locally verified environment. We are using **100% synthetic demo data**. No real patient information is present."

## 1. Role-Based Access ( staff Login ) (3 Mins)
- **Action**: Login as `Doctor`.
- **Point**: Show the Clinical Queue.
- **Action**: Logout. Login as `Pharmacist`.
- **Point**: Show the Dispense Workspace. "Note how the interface adapts to the user's scope of practice."

## 2. Clinical Integrity (Vitals & SOAP) (5 Mins)
- **Action**: Navigate to `[DEMO] Jane Doe`.
- **Action**: Enter vitals. Save a SOAP note.
- **Talk**: "We enforce a strict mutation allowlist. Only 13 specific clinical actions are allowed, preventing unauthorized data tampering."

## 3. Lab to Pharmacy Loop (7 Mins)
- **Action**: Create a Lab Order. 
- **Action**: (Switch to Lab Manager) Encode, Validate, and Release.
- **Action**: (Switch to Pharmacist) Navigate to Dispense Queue. Click `Dispense`.
- **Talk**: "This is the 'Atomic Dispense' feature. Inventory is deducted at the exact moment the clinical record is updated."

## 4. Security & Audit (5 Mins)
- **Action**: (Switch to Super Admin) Go to Audit Logs.
- **Point**: Show the signed hash for the medication dispense event.
- **Talk**: "We use Forensic Audit Logging. Every sensitive click creates an immutable record."

## 5. Limitations & Next Steps (4 Mins)
- **Talk**: "This foundation is 'Local Green.' The system is designed for HIPAA/SOC2 but requires a live cloud environment for formal audit."
- **Point**: "The next step is provisioning your staging cloud to move this from demo to operational baseline."

---

## What NOT to say
- "We are HIPAA certified." (Truth: We are designed for it, but not yet audited).
- "This is ready for production today." (Truth: Staging and load testing must happen first).
- "We use real data for testing." (Truth: We strictly use synthetic data).
