# Design Spec: Doctor Workflow Encounter Auto-Fill Hardening

**Date:** 2026-06-11
**Status:** Approved
**Topic:** UX Hardening - Doctor Prescribing Workflow

## 1. Problem Statement
Currently, doctors using the EMR workspace must manually copy-paste or type an Encounter UUID into the `DoctorPrescriptionPanel` to enable prescribing, even when an active encounter is clearly identified and loaded in the main `DoctorEMRPage`. This creates unnecessary friction and potential for manual entry errors.

## 2. Goals
- Eliminate manual UUID entry for the standard "active encounter" workflow.
- Maintain flexibility for manual overrides or cases with no active encounter.
- Preserve existing auto-draft recovery and submission integrity.

## 3. Proposed Changes

### 3.1 `DoctorEMRPage.tsx`
- Pass the `id` of the detected `activeEncounter` as a prop to `DoctorPrescriptionPanel`.
- Logic: `<DoctorPrescriptionPanel encounterId={activeEncounter?.id} ... />`

### 3.2 `DoctorPrescriptionPanel.tsx`
- **Prop Update**: Add `encounterId?: string` to `DoctorPrescriptionPanelProps`.
- **Auto-Fill Logic**:
    - Use a `useEffect` to monitor the incoming `encounterId` prop.
    - **Guard 1 (Empty Check)**: Only auto-fill if the current `formData.encounterId` is empty. This prevents clobbering manual edits.
    - **Guard 2 (Draft Priority)**: Ensure that if a draft is recovered from `useAutoDraft`, it is not overwritten by the auto-fill logic.
- **UI Indicators**:
    - When auto-filled, display a subtle informational label: `"Auto-filled from active encounter"`.
    - Keep the input field visible for transparency and manual override.
- **Form Initialization**:
    - On `patientId` change, reset the form to `EMPTY_FORM` (existing behavior) which clears the previous encounter ID, allowing the new patient's active encounter to auto-fill.

## 4. Success Criteria
- [x] Loading a patient with an active encounter auto-populates the Prescription encounter ID field.
- [x] Doctors can still manually change the encounter ID.
- [x] If no active encounter exists, the field remains empty and manual entry is available.
- [x] Recovered drafts preserve their own encounter ID and are not overwritten by the auto-fill.
- [x] Lint and Typecheck pass cleanly.

## 5. Implementation Plan (High Level)
1. Update `DoctorPrescriptionPanelProps` and component signature.
2. Implement `useEffect` for state synchronization with guards.
3. Update UI to show the "Auto-filled" indicator.
4. Update `DoctorEMRPage` to pass the prop.
5. Verify behavior with mock and real patient scenarios.
