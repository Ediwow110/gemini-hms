import { describe, it, expect, beforeEach } from "vitest";
import {
  saveAutoDraft,
  getAutoDraft,
  deleteAutoDraft,
  listAutoDraftsForUser,
  deleteAutoDraftsForUser,
} from "../lib/autodraft/indexedDbDraftStore";
import type { CreateDraftInput } from "../lib/autodraft/types";

describe("AutoDraft Store", () => {
  const baseInput: CreateDraftInput<{ text: string }> = {
    userId: "user-123",
    module: "patient-note",
    entityId: "patient-456",
    route: "/patients/patient-456/notes/new",
    formData: { text: "Initial draft content" },
    ttlHours: 1,
  };

  beforeEach(async () => {
    // Clean up any previous test data
    await deleteAutoDraftsForUser("user-123");
    await deleteAutoDraftsForUser("user-999");
  });

  it("saveAutoDraft creates a new draft with correct scoping", async () => {
    const draft = await saveAutoDraft(baseInput);
    expect(draft.draftId).toContain("patient-note:user-123:patient-456");
    expect(draft.userId).toBe("user-123");
    expect(draft.module).toBe("patient-note");
  });

  it("getAutoDraft returns the draft when not expired", async () => {
    const saved = await saveAutoDraft(baseInput);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).not.toBeNull();
    expect(loaded?.formData).toEqual({ text: "Initial draft content" });
  });

  it("getAutoDraft deletes and returns null for expired draft", async () => {
    const expiredInput = {
      ...baseInput,
      ttlHours: 0, // expires immediately
    };
    const saved = await saveAutoDraft(expiredInput);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("deleteAutoDraft removes the target draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("listAutoDraftsForUser returns only that user’s drafts", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({ ...baseInput, userId: "user-999", entityId: "other" });

    const userDrafts = await listAutoDraftsForUser("user-123");
    expect(userDrafts.length).toBe(1);
    expect(userDrafts[0].userId).toBe("user-123");
  });

  it("deleteAutoDraftsForUser removes only the target user’s drafts", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({ ...baseInput, userId: "user-999" });

    await deleteAutoDraftsForUser("user-123");

    const remaining = await listAutoDraftsForUser("user-999");
    expect(remaining.length).toBe(1);
  });

  it("sanitizeDraftFormData removes sensitive fields", async () => {
    const dirtyInput = {
      ...baseInput,
      formData: {
        text: "Note content",
        token: "secret-token",
        password: "p@ss",
        authorization: "Bearer xyz",
      },
    } as unknown as CreateDraftInput<Record<string, unknown>>;

    const saved = await saveAutoDraft(dirtyInput);
    expect(saved.formData).not.toHaveProperty("token");
    expect(saved.formData).not.toHaveProperty("password");
    expect(saved.formData).not.toHaveProperty("authorization");
    expect(saved.formData).toHaveProperty("text");
  });
});
