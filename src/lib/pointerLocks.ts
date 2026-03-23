const CLOSED_OVERLAY_SELECTOR =
  '[data-radix-portal] [data-state="closed"], [data-vaul-overlay][data-state="closed"]';
const RADIX_PORTAL_SELECTOR = "[data-radix-portal]";
const OPEN_OVERLAY_SELECTOR = '[data-state="open"], [data-vaul-overlay][data-state="open"]';

function unlockTarget(el: HTMLElement | null) {
  if (!el) return;

  if (el.style.pointerEvents === "none") {
    el.style.pointerEvents = "";
  }

  if (el.hasAttribute("inert")) {
    el.removeAttribute("inert");
  }
}

export function clearPointerLocks() {
  unlockTarget(document.body);
  unlockTarget(document.documentElement);
  unlockTarget(document.getElementById("root"));

  document.querySelectorAll<HTMLElement>(CLOSED_OVERLAY_SELECTOR).forEach((el) => {
    if (el.style.pointerEvents !== "none") {
      el.style.pointerEvents = "none";
    }
  });

  document.querySelectorAll<HTMLElement>(RADIX_PORTAL_SELECTOR).forEach((portal) => {
    const hasOpenOverlay = Boolean(portal.querySelector(OPEN_OVERLAY_SELECTOR));

    if (!hasOpenOverlay) {
      portal.style.pointerEvents = "none";
      return;
    }

    if (portal.style.pointerEvents === "none") {
      portal.style.pointerEvents = "";
    }
  });
}

export function clearPointerLocksSoon() {
  clearPointerLocks();
  requestAnimationFrame(clearPointerLocks);
  window.setTimeout(clearPointerLocks, 120);
  window.setTimeout(clearPointerLocks, 300);
}
