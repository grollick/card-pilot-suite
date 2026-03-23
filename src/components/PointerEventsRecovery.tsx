import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { clearPointerLocks, clearPointerLocksSoon } from "@/lib/pointerLocks";

export default function PointerEventsRecovery() {
  const location = useLocation();

  const unlock = useCallback(() => {
    clearPointerLocks();
  }, []);

  useEffect(() => {
    clearPointerLocksSoon();
  }, [location.pathname]);

  useEffect(() => {
    let timeoutId: number | undefined;

    const observer = new MutationObserver(() => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        clearPointerLocksSoon();
      }, 80);
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["style", "inert", "data-state"],
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "inert"],
    });

    const onWindowFocus = () => unlock();
    const onVisibilityChange = () => {
      if (!document.hidden) unlock();
    };
    const onPointerDown = () => unlock();

    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("pointerdown", onPointerDown, true);
      observer.disconnect();
    };
  }, [unlock]);

  useEffect(() => {
    const interval = setInterval(unlock, 1500);
    return () => clearInterval(interval);
  }, [unlock]);

  return null;
}
