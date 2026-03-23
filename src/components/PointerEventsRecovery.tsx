import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

/**
 * Nuclear-grade pointer-events recovery.
 * Ensures no stale overlay, portal, or Radix artifact can block page interaction.
 */
export default function PointerEventsRecovery() {
  const location = useLocation();

  const unlock = useCallback(() => {
    // 1. Clear body / html / root pointer locks
    for (const el of [document.body, document.documentElement]) {
      if (el.style.pointerEvents === "none") {
        console.warn("[PointerRecovery] Cleared pointer-events:none on", el.tagName);
        el.style.pointerEvents = "";
      }
    }
    const root = document.getElementById("root");
    if (root) {
      if (root.style.pointerEvents === "none") {
        console.warn("[PointerRecovery] Cleared pointer-events:none on #root");
        root.style.pointerEvents = "";
      }
      if (root.hasAttribute("inert")) {
        console.warn("[PointerRecovery] Removed inert from #root");
        root.removeAttribute("inert");
      }
    }

    // 2. Kill ALL stale Radix portals that are closed
    document.querySelectorAll<HTMLElement>("[data-radix-portal]").forEach((portal) => {
      const hasOpenContent = portal.querySelector('[data-state="open"]');
      if (!hasOpenContent) {
        // Entire portal is closed — nuke pointer events on every child
        portal.style.pointerEvents = "none";
        portal.querySelectorAll<HTMLElement>("*").forEach((child) => {
          if (child.style.pointerEvents !== "none") {
            child.style.pointerEvents = "none";
          }
        });
      }
    });

    // 3. Kill stale vaul overlays
    document.querySelectorAll<HTMLElement>('[data-vaul-overlay][data-state="closed"]').forEach((el) => {
      el.style.pointerEvents = "none";
    });

    // 4. Find any fixed/absolute full-screen element blocking clicks (diagnostic)
    document.querySelectorAll<HTMLElement>("[style], [class]").forEach((el) => {
      const style = window.getComputedStyle(el);
      if (
        (style.position === "fixed" || style.position === "absolute") &&
        style.pointerEvents !== "none" &&
        el.offsetWidth >= window.innerWidth * 0.9 &&
        el.offsetHeight >= window.innerHeight * 0.9 &&
        style.zIndex !== "auto" &&
        parseInt(style.zIndex) >= 40 &&
        style.opacity !== "0" &&
        el.id !== "root" &&
        !el.closest("[data-sidebar]") &&
        !el.closest("nav")
      ) {
        console.warn(
          "[PointerRecovery] Potential blocking overlay found:",
          el.tagName,
          el.className?.slice?.(0, 80),
          "z-index:", style.zIndex,
          "pointer-events:", style.pointerEvents
        );
        // Force pointer-events none on it if it looks like a dead overlay
        if (!el.querySelector("button, a, input, [role='dialog']")) {
          el.style.pointerEvents = "none";
          console.warn("[PointerRecovery] → Forced pointer-events:none on blocking overlay");
        }
      }
    });
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

  // MutationObserver: comprehensive watch
  useEffect(() => {
    let timeoutId: number | undefined;

    const observer = new MutationObserver(() => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(unlock, 80);
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
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Click diagnostic — log when clicks hit unexpected targets
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === document.body || target === document.documentElement || target?.id === "root") {
        console.warn("[PointerRecovery] Click landed on:", target.tagName, target.id || target.className?.slice?.(0, 60));
      }
    };
    document.addEventListener("click", onDocClick, true);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("click", onDocClick, true);
      observer.disconnect();
    };
  }, [unlock]);

  // Periodic safety net — every 1.5s
  useEffect(() => {
    const interval = setInterval(unlock, 1500);
    return () => clearInterval(interval);
  }, [unlock]);

  return null;
}