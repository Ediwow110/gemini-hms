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

type BillingDraftData = {
  paymentMethod: string;
};

describe("Billing AutoDraft", () => {
  const userId = "user-cashier-456";
  const invoiceId = "inv-789";

  const baseInput: CreateDraftInput<BillingDraftData> = {
    userId,
    module: "billing-invoice",
    entityId: invoiceId,
    route: `/cashier/billing?invoice=${invoiceId}`,
    formData: {
      paymentMethod: "card",
    },
    ttlHours: 72,
  };

  beforeEach(async () => {
    await deleteAutoDraftsForUser(userId);
    await deleteAutoDraftsForUser("user-other");
  });

  it("saveAutoDraft creates a draft with billing-invoice scoping", async () => {
    const draft = await saveAutoDraft(baseInput);
    expect(draft.draftId).toContain(`billing-invoice:${userId}:${invoiceId}`);
    expect(draft.module).toBe("billing-invoice");
    expect(draft.formData.paymentMethod).toBe("card");
  });

  it("getAutoDraft loads and returns unexpired billing draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    const loaded = await getAutoDraft<BillingDraftData>(saved.draftId);
    expect(loaded).not.toBeNull();
    expect(loaded!.formData.paymentMethod).toBe("card");
  });

  it("getAutoDraft returns null for expired billing draft", async () => {
    const saved = await saveAutoDraft({ ...baseInput, ttlHours: 0 });
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("deleteAutoDraft removes billing draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    const loaded = await getAutoDraft(saved.draftId);
    expect(loaded).toBeNull();
  });

  it("listAutoDraftsForUser isolates billing drafts by user", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({
      ...baseInput,
      userId: "user-other",
      entityId: "inv-other",
    });

    const userDrafts = await listAutoDraftsForUser(userId);
    expect(userDrafts.length).toBe(1);
    expect(userDrafts[0].userId).toBe(userId);
  });

  it("buildDraftId produces correct billing-invoice draft ID", () => {
    const draftId = buildDraftId({
      userId,
      module: "billing-invoice",
      entityId: invoiceId,
      route: `/cashier/billing?invoice=${invoiceId}`,
    });
    expect(draftId).toMatch(/^billing-invoice:user-cashier-456:inv-789:/);
  });

  it("sanitizeDraftFormData strips sensitive fields from billing draft", async () => {
    const { sanitizeDraftFormData } = await import("../lib/autodraft/types");
    const dirty: Record<string, unknown> = {
      paymentMethod: "cash",
      token: "secret-token",
      password: "p@ss",
      authorization: "Bearer xyz",
    };
    const clean = sanitizeDraftFormData(dirty);
    expect(clean).toHaveProperty("paymentMethod");
    expect(clean).not.toHaveProperty("token");
    expect(clean).not.toHaveProperty("password");
    expect(clean).not.toHaveProperty("authorization");
  });

  it("discard is idempotent for billing draft", async () => {
    const saved = await saveAutoDraft(baseInput);
    await deleteAutoDraft(saved.draftId);
    await expect(deleteAutoDraft(saved.draftId)).resolves.not.toThrow();
  });

  it("billing draft survives update (save, modify, load)", async () => {
    const saved = await saveAutoDraft(baseInput);
    const updated: CreateDraftInput<BillingDraftData> = {
      ...baseInput,
      formData: {
        paymentMethod: "hmo",
      },
    };
    await deleteAutoDraft(saved.draftId);
    const saved2 = await saveAutoDraft(updated);
    expect(saved2.formData.paymentMethod).toBe("hmo");
  });

  it("deleteAutoDraftsForUser removes only target user's billing drafts", async () => {
    await saveAutoDraft(baseInput);
    await saveAutoDraft({ ...baseInput, userId: "user-other" });

    await deleteAutoDraftsForUser(userId);

    const remaining = await listAutoDraftsForUser("user-other");
    expect(remaining.length).toBe(1);
  });

  it("DraftRecoveryDialog renders billing safety message when provided", () => {
    const msg = "Recovered billing draft — review all fields carefully before submitting payment. This is local browser data, not a processed payment or receipt.";
    const draft = {
      draftId: "billing-invoice:user-1:inv-1:/cashier/billing?invoice=inv-1",
      userId: "user-1",
      module: "billing-invoice" as const,
      entityId: "inv-1",
      route: "/cashier/billing?invoice=inv-1",
      formData: { paymentMethod: "cash" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} message={msg} />);
    expect(screen.getByText(msg)).toBeTruthy();
  });

  it("DraftRecoveryDialog does not render message section when message is omitted", () => {
    const draft = {
      draftId: "billing-invoice:user-1:inv-1:/cashier/billing?invoice=inv-1",
      userId: "user-1",
      module: "billing-invoice" as const,
      entityId: "inv-1",
      route: "/cashier/billing?invoice=inv-1",
      formData: { paymentMethod: "cash" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72000000).toISOString(),
    };
    const { container } = render(<DraftRecoveryDialog draft={draft} onResume={() => {}} onDiscard={() => {}} />);
    expect(container.querySelector(".bg-amber-50")).toBeNull();
  });
});
