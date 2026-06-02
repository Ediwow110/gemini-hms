import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AutoDraft,
  AutoDraftModule,
  buildDraftId,
} from "./types";
import {
  deleteAutoDraft,
  getAutoDraft,
  saveAutoDraft,
} from "./indexedDbDraftStore";

type UseAutoDraftOptions<TFormData> = {
  enabled: boolean;
  userId: string;
  module: AutoDraftModule;
  entityId?: string | null;
  route: string;
  formData: TFormData;
  isDirty: boolean;
  ttlHours?: number;
  appVersion?: string;
  idleMs?: number;
  periodicMs?: number;
};

type UseAutoDraftResult<TFormData> = {
  draftId: string;
  lastDraft: AutoDraft<TFormData> | null;
  recoveredDraft: AutoDraft<TFormData> | null;
  isSavingDraft: boolean;
  saveNow: () => Promise<void>;
  discardDraft: () => Promise<void>;
  clearRecoveredDraft: () => void;
};

export function useAutoDraft<TFormData>(
  options: UseAutoDraftOptions<TFormData>
): UseAutoDraftResult<TFormData> {
  const {
    enabled,
    userId,
    module,
    entityId,
    route,
    formData,
    isDirty,
    ttlHours = 72,
    appVersion,
    idleMs = 2000,
    periodicMs = 30000,
  } = options;

  const [lastDraft, setLastDraft] = useState<AutoDraft<TFormData> | null>(null);
  const [recoveredDraft, setRecoveredDraft] = useState<AutoDraft<TFormData> | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const idleTimerRef = useRef<number | null>(null);
  const latestFormDataRef = useRef(formData);

  useEffect(() => {
    latestFormDataRef.current = formData;
  }, [formData]);

  const draftId = useMemo(
    () => buildDraftId({ userId, module, entityId, route }),
    [userId, module, entityId, route]
  );

  const saveNow = useCallback(async () => {
    if (!enabled || !isDirty || !userId) return;

    setIsSavingDraft(true);
    try {
      const draft = await saveAutoDraft({
        userId,
        module,
        entityId,
        route,
        formData: latestFormDataRef.current,
        ttlHours,
        appVersion,
      });
      setLastDraft(draft as AutoDraft<TFormData>);
    } finally {
      setIsSavingDraft(false);
    }
  }, [enabled, isDirty, userId, module, entityId, route, ttlHours, appVersion]);

  const discardDraft = useCallback(async () => {
    await deleteAutoDraft(draftId);
    setLastDraft(null);
    setRecoveredDraft(null);
  }, [draftId]);

  const clearRecoveredDraft = useCallback(() => {
    setRecoveredDraft(null);
  }, []);

  // Initial recovery check.
  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;

    getAutoDraft<TFormData>(draftId).then((draft) => {
      if (cancelled) return;
      if (draft) {
        setRecoveredDraft(draft);
        setLastDraft(draft);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, userId, draftId]);

  // Idle save after user stops typing/changing form.
  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = window.setTimeout(() => {
      saveNow();
    }, idleMs);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, isDirty, formData, idleMs, saveNow]);

  // Periodic save while dirty.
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const interval = window.setInterval(() => {
      saveNow();
    }, periodicMs);

    return () => window.clearInterval(interval);
  }, [enabled, isDirty, periodicMs, saveNow]);

  // Save when tab becomes hidden.
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveNow();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled, isDirty, saveNow]);

  // Best-effort save before unload.
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const onBeforeUnload = () => {
      saveNow();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled, isDirty, saveNow]);

  return {
    draftId,
    lastDraft,
    recoveredDraft,
    isSavingDraft,
    saveNow,
    discardDraft,
    clearRecoveredDraft,
  };
}
