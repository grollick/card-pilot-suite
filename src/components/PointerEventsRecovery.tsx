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
  }, [location.pathname, location.search, location.hash, location.key]);

  useEffect(() => {
    let timeoutId: number | undefined;

    const observer = new MutationObserver(() => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        clearPointerLocksSoon();
      }, 40);
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
    const onPageShow = () => unlock();
    const onPopState = () => unlock();
    const onVisibilityChange = () => {
      if (!document.hidden) unlock();
    };
    const onPointerDown = () => unlock();
    const onClickCapture = () => unlock();

    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClickCapture, true);
      observer.disconnect();
    };
  }, [unlock]);

  useEffect(() => {
    unlock();
    const interval = setInterval(unlock, 500);
    return () => clearInterval(interval);
  }, [unlock]);

  return null;
}
