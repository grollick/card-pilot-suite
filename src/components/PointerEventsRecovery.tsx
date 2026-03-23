import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export default function PointerEventsRecovery() {
  const location = useLocation();

  const unlock = useCallback(() => {
    // Don't clear if a Radix dialog/popover is legitimately open
    const hasOpen =
      document.querySelector('[role="dialog"][data-state="open"]') ||
      document.querySelector('[data-radix-popper-content-wrapper]');
    if (hasOpen) return;

    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
    if (document.documentElement.style.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "";
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
    const observer = new MutationObserver(() => {
      if (document.body.style.pointerEvents === "none") {
        // Give Radix 300ms to finish its work, then force-clear if stale
        setTimeout(() => {
          const hasOpen =
            document.querySelector('[role="dialog"][data-state="open"]') ||
            document.querySelector('[data-radix-popper-content-wrapper]');
          if (!hasOpen && document.body.style.pointerEvents === "none") {
            document.body.style.pointerEvents = "";
          }
        }, 300);
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => {
      observer.disconnect();
    };
  }, []);

  // Periodic safety net — every 2s clear stale pointer-events
  useEffect(() => {
    const interval = setInterval(() => {
      unlock();
    }, 2000);
    return () => clearInterval(interval);
  }, [unlock]);

  return null;
}