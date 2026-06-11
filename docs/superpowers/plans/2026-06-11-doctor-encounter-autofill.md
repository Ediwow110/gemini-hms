# Doctor Encounter Auto-Fill Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove manual UUID entry friction in the doctor prescribing workflow by auto-filling the encounter ID from the active workspace encounter while preserving manual overrides and draft priority.

**Architecture:** Inject `encounterId` as a prop into the Prescription panel and use a guarded `useEffect` to synchronize form state without clobbering existing edits or recovered drafts.

**Tech Stack:** React (TypeScript), Lucide React (Icons), Tailwind CSS (Utility classes).

---

### Task 1: Update DoctorPrescriptionPanel Interface and Prop Handling

**Files:**
- Modify: `hms-frontend/src/portals/doctor/components/DoctorPrescriptionPanel.tsx`

- [ ] **Step 1: Update the component interface and signature**

Add `encounterId?: string` to `DoctorPrescriptionPanelProps` and destructure it in the component.

```tsx
interface DoctorPrescriptionPanelProps {
  patientId: string;
  isLocked: boolean;
  currentUserId: string;
  encounterId?: string; // Add this
}

export const DoctorPrescriptionPanel = ({ 
  patientId, 
  isLocked, 
  currentUserId,
  encounterId // Destructure here
}: DoctorPrescriptionPanelProps) => {
```

- [ ] **Step 2: Implement guarded auto-fill useEffect**

Add the `useEffect` to synchronize the incoming `encounterId` prop with `formData`.

```tsx
  // Auto-fill encounterId from prop if form field is empty and no draft was just recovered
  useEffect(() => {
    if (encounterId && !formData.encounterId) {
      setFormData((prev) => ({ ...prev, encounterId }));
      // We don't set isDirty to true here because it's a system auto-fill, 
      // not a user edit that should trigger "unsaved changes" warnings immediately
    }
  }, [encounterId, formData.encounterId]);
```

- [ ] **Step 3: Add the informational UI indicator**

Insert the "Auto-filled" label below the Encounter ID input field.

```tsx
      {/* Encounter ID input (required for prescription creation) */}
      {!isLocked && !formData.encounterId && (
        // ... existing empty state ...
      )}

      {!isLocked && formData.encounterId && (
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Encounter ID</label>
            {encounterId === formData.encounterId && (
              <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                Linked to active encounter
              </span>
            )}
          </div>
          <input
            type="text"
            value={formData.encounterId}
            onChange={(e) => updateField('encounterId', e.target.value)}
            placeholder="Paste encounter UUID..."
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
          />
        </div>
      )}
```

- [ ] **Step 4: Commit changes**

```bash
git add hms-frontend/src/portals/doctor/components/DoctorPrescriptionPanel.tsx
git commit -m "feat(doctor): implement encounter auto-fill with smart default in prescription panel"
```

---

### Task 2: Pass Active Encounter from DoctorEMRPage

**Files:**
- Modify: `hms-frontend/src/portals/doctor/DoctorEMRPage.tsx`

- [ ] **Step 1: Pass the encounterId prop to DoctorPrescriptionPanel**

```tsx
          {/* Panel 3: Right (Clinical Context - Orders, Results, prescriptions) - spans 4 columns */}
          <div className="xl:col-span-4 space-y-5">
            <DoctorPrescriptionPanel 
              patientId={activePatient.id} 
              isLocked={false} 
              currentUserId={user?.id ?? ''} 
              encounterId={activeEncounter?.id} // Add this
            />
            {/* ... other panels ... */}
          </div>
```

- [ ] **Step 2: Commit changes**

```bash
git add hms-frontend/src/portals/doctor/DoctorEMRPage.tsx
git commit -m "feat(doctor): pass active encounter ID to prescription panel"
```

---

### Task 3: Validation and Verification

- [ ] **Step 1: Run Lint and Typecheck**

Run: `npm run lint` and `npx tsc --noEmit` in `hms-frontend`.
Expected: No errors related to the changed files.

- [ ] **Step 2: Manual Verification Scenarios**

1. **Active Encounter Flow**: Load a patient with an active encounter. Verify the Prescription Panel's Encounter ID is pre-filled and shows "Linked to active encounter".
2. **No Encounter Flow**: Load a patient with NO active encounter. Verify the field is empty and shows the "Enter Encounter ID" prompt.
3. **Manual Override**: With an auto-filled ID, manually change it. Verify the "Linked" label disappears and the new ID is preserved.
4. **Draft Recovery**: Create a draft for Encounter A. Refresh/Navigate away. Return. Recover the draft. Ensure the draft's Encounter A is NOT overwritten by the auto-fill logic if the prop is different (though usually they would match).
5. **Patient Change**: Switch patients. Verify the form resets and auto-fills the NEW patient's encounter ID correctly.

- [ ] **Step 3: Commit verification status**

Update `docs/superpowers/specs/2026-06-11-doctor-encounter-autofill-design.md` with verification results if needed, or simply log finality.
