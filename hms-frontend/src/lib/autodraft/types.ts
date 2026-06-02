export type AutoDraftModule =
  | "patient-note"
  | "prescription"
  | "billing-invoice"
  | "appointment"
  | "admin-form";

export type AutoDraft<TFormData = unknown> = {
  draftId: string;
  userId: string;
  module: AutoDraftModule;
  entityId?: string | null;
  route: string;
  formData: TFormData;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  appVersion?: string;
};

export type CreateDraftInput<TFormData> = {
  userId: string;
  module: AutoDraftModule;
  entityId?: string | null;
  route: string;
  formData: TFormData;
  ttlHours?: number;
  appVersion?: string;
};

export function buildDraftId(input: {
  userId: string;
  module: AutoDraftModule;
  entityId?: string | null;
  route: string;
}): string {
  const entity = input.entityId?.trim() || "new";
  const normalizedRoute = input.route.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${input.module}:${input.userId}:${entity}:${normalizedRoute}`;
}

export function isDraftExpired(draft: AutoDraft): boolean {
  return new Date(draft.expiresAt).getTime() <= Date.now();
}

export function sanitizeDraftFormData<T>(formData: T): T {
  if (formData === null || typeof formData !== "object") {
    return formData;
  }

  const blockedKeys = new Set([
    "token",
    "accessToken",
    "refreshToken",
    "authorization",
    "password",
    "confirmPassword",
    "cookie",
    "session",
    "sessionId",
    "secret",
    "apiKey",
  ]);

  if (Array.isArray(formData)) {
    return formData.map((item) => sanitizeDraftFormData(item)) as T;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(formData as Record<string, unknown>)) {
    if (blockedKeys.has(key)) continue;
    output[key] = sanitizeDraftFormData(value);
  }

  return output as T;
}
