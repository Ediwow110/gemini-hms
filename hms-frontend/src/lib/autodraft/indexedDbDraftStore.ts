import {
  AutoDraft,
  CreateDraftInput,
  buildDraftId,
  isDraftExpired,
  sanitizeDraftFormData,
} from "./types";

const DB_NAME = "gemini-hms-autodrafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "draftId" });
        store.createIndex("byUserId", "userId", { unique: false });
        store.createIndex("byModule", "module", { unique: false });
        store.createIndex("byUpdatedAt", "updatedAt", { unique: false });
        store.createIndex("byExpiresAt", "expiresAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  const db = await openDraftDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    tx.oncomplete = () => {
      db.close();
      resolve(request ? request.result : undefined);
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveAutoDraft<TFormData>(
  input: CreateDraftInput<TFormData>
): Promise<AutoDraft<TFormData>> {
  const now = new Date();
  const ttlHours = input.ttlHours ?? 72;
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const draftId = buildDraftId({
    userId: input.userId,
    module: input.module,
    entityId: input.entityId,
    route: input.route,
  });

  const existing = await getAutoDraft<TFormData>(draftId);

  const draft: AutoDraft<TFormData> = {
    draftId,
    userId: input.userId,
    module: input.module,
    entityId: input.entityId ?? null,
    route: input.route,
    formData: sanitizeDraftFormData(input.formData),
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    appVersion: input.appVersion,
  };

  await withStore("readwrite", (store) => store.put(draft));
  return draft;
}

export async function getAutoDraft<TFormData = unknown>(
  draftId: string
): Promise<AutoDraft<TFormData> | null> {
  const draft = await withStore<AutoDraft<TFormData>>("readonly", (store) =>
    store.get(draftId)
  );

  if (!draft) return null;

  if (isDraftExpired(draft)) {
    await deleteAutoDraft(draft.draftId);
    return null;
  }

  return draft;
}

export async function listAutoDraftsForUser(
  userId: string
): Promise<AutoDraft[]> {
  const db = await openDraftDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("byUserId");
    const request = index.getAll(userId);

    request.onsuccess = async () => {
      const drafts = request.result ?? [];
      const validDrafts = drafts.filter((draft) => !isDraftExpired(draft));
      const expiredDrafts = drafts.filter((draft) => isDraftExpired(draft));

      db.close();

      await Promise.all(expiredDrafts.map((draft) => deleteAutoDraft(draft.draftId)));

      resolve(validDrafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteAutoDraft(draftId: string): Promise<void> {
  await withStore("readwrite", (store) => {
    store.delete(draftId);
  });
}

export async function deleteAutoDraftsForUser(userId: string): Promise<void> {
  const drafts = await listAutoDraftsForUser(userId);
  await Promise.all(drafts.map((draft) => deleteAutoDraft(draft.draftId)));
}

export async function cleanupExpiredAutoDrafts(): Promise<number> {
  const db = await openDraftDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const drafts = request.result ?? [];
      const expired = drafts.filter((draft) => isDraftExpired(draft));
      db.close();

      await Promise.all(expired.map((draft) => deleteAutoDraft(draft.draftId)));
      resolve(expired.length);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}
