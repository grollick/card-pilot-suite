import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const POINTER_UNLOCK_DELAY_MS = 120;

export default function PointerEventsRecovery() {
  const location = useLocation();

  useEffect(() => {
    const unlockPointerState = () => {
      const hasOpenDialog = !!document.querySelector('[role="dialog"][data-state="open"]');
      if (hasOpenDialog) return;

      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }

      if (document.documentElement.style.pointerEvents === "none") {
        document.documentElement.style.pointerEvents = "";
      }
    };

    unlockPointerState();
    const raf = window.requestAnimationFrame(unlockPointerState);
    const timeout = window.setTimeout(unlockPointerState, POINTER_UNLOCK_DELAY_MS);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [location.pathname]);

  return null;
}