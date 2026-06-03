import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AutoDraft,
  AutoDraftModule,
  buildDraftId,
} from "./types";
import {
  getAutoDraft,
  safeDeleteAutoDraft,
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
  const pendingSaveRef = useRef(false);
  const saveParamsRef = useRef({ enabled, isDirty, userId, module, entityId, route, ttlHours, appVersion });
  const saveNowRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    latestFormDataRef.current = formData;
    saveParamsRef.current = { enabled, isDirty, userId, module, entityId, route, ttlHours, appVersion };
  });

  const draftId = useMemo(
    () => buildDraftId({ userId, module, entityId, route }),
    [userId, module, entityId, route]
  );

  const saveNow = useCallback(async () => {
    const p = saveParamsRef.current;
    if (!p.enabled || !p.isDirty || !p.userId) return;
    if (pendingSaveRef.current) return;

    pendingSaveRef.current = true;
    setIsSavingDraft(true);
    try {
      const draft = await saveAutoDraft({
        userId: p.userId,
        module: p.module,
        entityId: p.entityId,
        route: p.route,
        formData: latestFormDataRef.current,
        ttlHours: p.ttlHours,
        appVersion: p.appVersion,
      });
      setLastDraft(draft as AutoDraft<TFormData>);
    } finally {
      setIsSavingDraft(false);
      pendingSaveRef.current = false;
    }
  }, []);

  useEffect(() => {
    saveNowRef.current = saveNow;
  });

  const discardDraft = useCallback(async () => {
    await safeDeleteAutoDraft(draftId, "user-discard");
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
      saveNowRef.current();
    }, idleMs);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, [enabled, isDirty, formData, idleMs]);

  // Periodic save while dirty.
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const interval = window.setInterval(() => {
      saveNowRef.current();
    }, periodicMs);

    return () => window.clearInterval(interval);
  }, [enabled, isDirty, periodicMs]);

  // Stable listeners: visibility change + beforeunload.
  // Uses ref-based dirty check to avoid add/remove churn on keystroke.
  useEffect(() => {
    if (!enabled) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && saveParamsRef.current.isDirty) {
        saveNowRef.current();
      }
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveParamsRef.current.isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [enabled]);

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
