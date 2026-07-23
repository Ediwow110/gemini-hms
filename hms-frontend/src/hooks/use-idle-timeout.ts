import { useEffect, useRef, useCallback } from 'react';

const IDLE_WARNING_MS = 14 * 60 * 1000; // Warn at 14 minutes
const IDLE_LOGOUT_MS = 15 * 60 * 1000; // Logout at 15 minutes

export function useIdleTimeout(onWarning: () => void, onLogout: () => void, enabled: boolean = true) {
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    if (!enabled) return;

    warningTimer.current = setTimeout(onWarning, IDLE_WARNING_MS);
    logoutTimer.current = setTimeout(onLogout, IDLE_LOGOUT_MS);
  }, [onWarning, onLogout, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimers();

    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [resetTimers, enabled]);

  return { resetTimers };
}
