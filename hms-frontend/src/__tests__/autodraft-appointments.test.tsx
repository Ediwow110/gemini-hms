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

type AppointmentDraftData = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  insuranceProvider: string;
  policyId: string;
  emergencyName: string;
  emergencyPhone: string;
  reason: string;
  referredDept: string;
};

describe("Appointment AutoDraft", () => {
  const userId = "user-nurse-123";

  const baseFormData: AppointmentDraftData = {
    firstName: "John",
    lastName: "Doe",
    dob: "1990-01-15",
    gender: "Male",
    email: "john@example.com",
    phone: "555-0100",
    address: "123 Main St, City",
    insuranceProvider: "Blue Shield",
    policyId: "BS-909283",
    emergencyName: "Jane Doe",
    emergencyPhone: "555-0101",
    reason: "Chest pain",
    referredDept: "cardio",
  };

  const baseInput: CreateDraftInput<AppointmentDraftData> = {
    userId,
    module: "appointment",
    entityId: null,
    route: "/nurse/intake",
    formData: baseFormData,
    ttlHours: 72,
  };

  beforeEach(async () => {
    await deleteAutoDraftsForUser(userId);
    await deleteAutoDraftsForUser("user-other");
  });

  it("saveAutoDraft creates a draft with appointment scoping", async () => {
    const draft = await saveAutoDraft(baseInput);
    expect(draft.draftId).toContain(`appointment:${userId}`);
    expect(draft.module).toBe("appointment");
    expect(draft.formData.firstName).toBe("John");
    expect(draft.formData.referredDept).toBe("cardio");
  });

  it("getAutoDraft loads and returns unexpired appointment draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    const loaded = await getAutoDraft<AppointmentDraftData>(saved.draftId);
    expect(loaded).not.toBeNull();
    expect(loaded!.formData.firstName).toBe("John");
  });

  it("getAutoDraft returns null for expired appointment draft", async () => {
    const saved = await saveAutoDraft({ ...baseInput, ttlHours: 0 });
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("deleteAutoDraft removes appointment draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("listAutoDraftsForUser isolates appointment drafts by user", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({
      ...baseInput,
      userId: "user-other",
    });

    const userDrafts = await listAutoDraftsForUser(userId);
    expect(userDrafts.length).toBe(1);
    expect(userDrafts[0].userId).toBe(userId);
  });

  it("buildDraftId produces correct appointment draft ID with null entityId fallback", () => {
    const draftId = buildDraftId({
      userId,
      module: "appointment",
      entityId: null,
      route: "/nurse/intake",
    });
    expect(draftId).toMatch(/^appointment:user-nurse-123:new:/);
  });

  it("sanitizeDraftFormData strips sensitive fields from appointment draft", async () => {
    const { sanitizeDraftFormData } = await import("../lib/autodraft/types");
    const dirty: Record<string, unknown> = {
      firstName: "John",
      password: "secret123",
      token: "abc",
      referredDept: "cardio",
    };
    const clean = sanitizeDraftFormData(dirty);
    expect(clean).toHaveProperty("firstName");
    expect(clean).toHaveProperty("referredDept");
    expect(clean).not.toHaveProperty("password");
    expect(clean).not.toHaveProperty("token");
  });

  it("discard is idempotent for appointment draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    await expect(deleteAutoDraft(saved.draftId)).resolves.not.toThrow();
  });

  it("appointment draft survives update (save, modify, load)", async () => {
    const saved = await saveAutoDraft(baseInput);
    const updated: CreateDraftInput<AppointmentDraftData> = {
      ...baseInput,
      formData: {
        ...baseFormData,
        firstName: "Jane",
        referredDept: "er",
      },
    };
    await deleteAutoDraft(saved.draftId);
    const saved2 = await saveAutoDraft(updated);
    expect(saved2.formData.firstName).toBe("Jane");
    expect(saved2.formData.referredDept).toBe("er");
  });

  it("deleteAutoDraftsForUser removes only target user's appointment drafts", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({ ...baseInput, userId: "user-other" });

    await deleteAutoDraftsForUser(userId);

    const remaining = await listAutoDraftsForUser("user-other");
    expect(remaining.length).toBe(1);
  });

  it("DraftRecoveryDialog renders appointment safety message when provided", () => {
    const msg = "Recovered intake draft — this is local browser data, not a saved patient record. Verify all fields before submitting.";
    const draft = {
      draftId: "appointment:user-nurse-123:new:/nurse/intake",
      userId: "user-nurse-123",
      module: "appointment" as const,
      entityId: null,
      route: "/nurse/intake",
      formData: baseFormData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} message={msg} />);
    expect(screen.getByText(msg)).toBeTruthy();
  });

  it("DraftRecoveryDialog does not render message section when message is omitted", () => {
    const draft = {
      draftId: "appointment:user-nurse-123:new:/nurse/intake",
      userId: "user-nurse-123",
      module: "appointment" as const,
      entityId: null,
      route: "/nurse/intake",
      formData: baseFormData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    const { container } = render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} />);
    expect(container.querySelector(".bg-amber-50")).toBeNull();
  });
});
