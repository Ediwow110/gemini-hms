import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  saveAutoDraft,
  getAutoDraft,
  deleteAutoDraft,
  deleteAutoDraftsForUser,
  listAutoDraftsForUser,
} from "../lib/autodraft/indexedDbDraftStore";
import type { CreateDraftInput } from "../lib/autodraft/types";
import { buildDraftId } from "../lib/autodraft/types";
import { DraftRecoveryDialog } from "../lib/autodraft/DraftRecoveryDialog";

type PrescriptionDraftData = {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  encounterId: string;
};

describe("Prescription AutoDraft", () => {
  const userId = "user-dr-123";
  const patientId = "patient-456";

  const baseInput: CreateDraftInput<PrescriptionDraftData> = {
    userId,
    module: "prescription",
    entityId: patientId,
    route: `/patients/${patientId}/prescriptions/new`,
    formData: {
      medicationName: "Amoxicillin 500mg",
      dosage: "1 capsule",
      frequency: "Three times daily (TID)",
      duration: "7 days",
      instructions: "Take after meals",
      encounterId: "enc-789",
    },
    ttlHours: 72,
  };

  beforeEach(async () => {
    await deleteAutoDraftsForUser(userId);
    await deleteAutoDraftsForUser("user-other");
  });

  it("saveAutoDraft creates a draft with prescription scoping", async () => {
    const draft = await saveAutoDraft(baseInput);
    expect(draft.draftId).toContain(`prescription:${userId}:${patientId}`);
    expect(draft.module).toBe("prescription");
    expect(draft.formData.medicationName).toBe("Amoxicillin 500mg");
  });

  it("getAutoDraft loads and returns unexpired prescription draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    const loaded = await getAutoDraft<PrescriptionDraftData>(saved.draftId);
    expect(loaded).not.toBeNull();
    expect(loaded!.formData.dosage).toBe("1 capsule");
    expect(loaded!.formData.frequency).toBe("Three times daily (TID)");
  });

  it("getAutoDraft returns null for expired prescription draft", async () => {
    const saved = await saveAutoDraft({ ...baseInput, ttlHours: 0 });
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("deleteAutoDraft removes prescription draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("listAutoDraftsForUser isolates drafts by user", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({
      ...baseInput,
      userId: "user-other",
      entityId: "patient-other",
    });

    const userDrafts = await listAutoDraftsForUser(userId);
    expect(userDrafts.length).toBe(1);
    expect(userDrafts[0].userId).toBe(userId);
  });

  it("buildDraftId produces correct prescription draft ID", () => {
    const draftId = buildDraftId({
      userId,
      module: "prescription",
      entityId: patientId,
      route: `/patients/${patientId}/prescriptions/new`,
    });
    expect(draftId).toMatch(/^prescription:user-dr-123:patient-456:/);
  });

  it("sanitizeDraftFormData strips sensitive fields from prescription draft", async () => {
    const { sanitizeDraftFormData } = await import("../lib/autodraft/types");
    const dirty: Record<string, unknown> = {
      medicationName: "Amoxicillin",
      token: "secret-token",
      password: "p@ss",
      authorization: "Bearer xyz",
      dosage: "1 capsule",
    };
    const clean = sanitizeDraftFormData(dirty);
    expect(clean).toHaveProperty("medicationName");
    expect(clean).toHaveProperty("dosage");
    expect(clean).not.toHaveProperty("token");
    expect(clean).not.toHaveProperty("password");
    expect(clean).not.toHaveProperty("authorization");
  });

  it("discard is idempotent — calling twice does not error", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    await expect(deleteAutoDraft(saved.draftId)).resolves.not.toThrow();
  });

  it("prescription draft survives update (save, modify, load)", async () => {
    const saved = await saveAutoDraft(baseInput);
    const updated: CreateDraftInput<PrescriptionDraftData> = {
      ...baseInput,
      formData: {
        ...baseInput.formData,
        dosage: "2 capsules",
        instructions: "Take with food",
      },
    };
    await deleteAutoDraft(saved.draftId);
    const saved2 = await saveAutoDraft(updated);
    expect(saved2.formData.dosage).toBe("2 capsules");
    expect(saved2.formData.instructions).toBe("Take with food");
  });

  it("deleteAutoDraftsForUser removes only target user's prescription drafts", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({ ...baseInput, userId: "user-other" });

    await deleteAutoDraftsForUser(userId);

    const remaining = await listAutoDraftsForUser("user-other");
    expect(remaining.length).toBe(1);
  });

  it("DraftRecoveryDialog renders prescription safety message when provided", () => {
    const msg = "Recovered prescription draft — review all fields carefully before submitting. This is local browser data, not a saved prescription.";
    const draft = {
      draftId: "prescription:user-1:patient-1:/patients/patient-1/prescriptions/new",
      userId: "user-1",
      module: "prescription" as const,
      entityId: "patient-1",
      route: "/patients/patient-1/prescriptions/new",
      formData: { medicationName: "Test", dosage: "1 tab", frequency: "OD", duration: "7d", instructions: "", encounterId: "enc-1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} message={msg} />);
    expect(screen.getByText(msg)).toBeTruthy();
  });

  it("DraftRecoveryDialog does not render message section when message is omitted", () => {
    const draft = {
      draftId: "prescription:user-1:patient-1:/patients/patient-1/prescriptions/new",
      userId: "user-1",
      module: "prescription" as const,
      entityId: "patient-1",
      route: "/patients/patient-1/prescriptions/new",
      formData: { medicationName: "Test", dosage: "1 tab", frequency: "OD", duration: "7d", instructions: "", encounterId: "enc-1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    const { container } = render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} />);
    expect(container.querySelector(".bg-amber-50")).toBeNull();
  });
});
