import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export default function PointerEventsRecovery() {
  const location = useLocation();

  const unlock = useCallback(() => {
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "";
    }

    const root = document.getElementById("root");
    if (root && (root as HTMLElement).style.pointerEvents === "none") {
      (root as HTMLElement).style.pointerEvents = "";
    }

    if (root?.hasAttribute("inert")) {
      root.removeAttribute("inert");
    }
  }, []);

  // Run on every route change
  useEffect(() => {
    unlock();
    const raf = requestAnimationFrame(unlock);
    const t = setTimeout(unlock, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [location.pathname, unlock]);

  // MutationObserver: watch for stuck pointer-events on body
  useEffect(() => {
    let timeoutId: number | undefined;

    const observer = new MutationObserver(() => {
      if (document.body.style.pointerEvents === "none") {
        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(unlock, 200);
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    const onWindowFocus = () => unlock();
    const onVisibilityChange = () => {
      if (!document.hidden) unlock();
    };
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
    };
  }, [unlock]);

  // Periodic safety net — every 2s clear stale pointer-events
  useEffect(() => {
    const interval = setInterval(() => {
      unlock();
    }, 2000);
    return () => clearInterval(interval);
  }, [unlock]);

  return null;
}