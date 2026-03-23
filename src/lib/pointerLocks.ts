const CLOSED_OVERLAY_SELECTOR =
  '[data-radix-portal] [data-state="closed"], [data-vaul-overlay][data-state="closed"]';

export function clearPointerLocks() {
  if (document.body.style.pointerEvents === "none") {
    document.body.style.pointerEvents = "";
  }
  if (document.documentElement.style.pointerEvents === "none") {
    document.documentElement.style.pointerEvents = "";
  }

  const root = document.getElementById("root");
  if (root && root.style.pointerEvents === "none") {
    root.style.pointerEvents = "";
  }
  if (root?.hasAttribute("inert")) {
    root.removeAttribute("inert");
  }

  document.querySelectorAll<HTMLElement>(CLOSED_OVERLAY_SELECTOR).forEach((el) => {
    if (el.style.pointerEvents !== "none") {
      el.style.pointerEvents = "none";
    }
  });
}

export function clearPointerLocksSoon() {
  clearPointerLocks();
  requestAnimationFrame(clearPointerLocks);
  window.setTimeout(clearPointerLocks, 120);
}
